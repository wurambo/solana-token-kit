import {
  PublicKey,
  Signer,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  jsonInfo2PoolKeys,
  Liquidity,
  MAINNET_PROGRAM_ID,
  MARKET_STATE_LAYOUT_V3,
  LiquidityPoolKeys,
  Token,
  TokenAmount,
  ONE,
  TOKEN_PROGRAM_ID,
  parseBigNumberish,
  buildSimpleTransaction,
} from "@raydium-io/raydium-sdk";
import { unpackMint } from "@solana/spl-token";
import {
  getTokenAccountBalance,
  assert,
  getWalletTokenAccount,
} from "./utils/get_balance";
import {
  build_swap_instructions,
  build_create_pool_instructions,
} from "./utils/build_a_sendtxn";
import {
  connection,
  LP_wallet_keypair,
  market_id,
  quote_Mint_amount,
  input_baseMint_tokens_percentage,
  lookupTableCache,
  delay_pool_open_time,
  DEFAULT_TOKEN,
  swap_sol_amount,
  addLookupTableInfo,
  makeTxVersion,
  create_pool_fees,
} from "../config/config";
import { monitor_both } from "./utils/monitor";
import { sendBundle } from "./utils/jitoBundle/sendBundle";
import { swapWallets as swapWalletsConfig } from "../config/config-swap-wallets";

async function txCreateAndInitNewPool() {
  console.log("------------- get pool keys for pool creation---------");

  const tokenAccountRawInfos_LP = await getWalletTokenAccount(
    connection,
    LP_wallet_keypair.publicKey
  );

  const marketBufferInfo = await connection.getAccountInfo(market_id);

  if (!marketBufferInfo) {
    console.log("No market info found. Exit and try again");
  }

  const {
    baseMint,
    quoteMint,
    baseVault: marketBaseVault,
    quoteVault: marketQuoteVault,
    bids: marketBids,
    asks: marketAsks,
    eventQueue: marketEventQueue,
  } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo?.data!);
  console.log("Base mint: ", baseMint.toString());
  console.log("Quote mint: ", quoteMint.toString());

  const accountInfo_base = await connection.getAccountInfo(baseMint);
  if (!accountInfo_base) return;
  const baseTokenProgramId = accountInfo_base.owner;
  const baseDecimals = unpackMint(
    baseMint,
    accountInfo_base,
    baseTokenProgramId
  ).decimals;

  const accountInfo_quote = await connection.getAccountInfo(quoteMint);
  if (!accountInfo_quote) return;
  const quoteTokenProgramId = accountInfo_quote.owner;
  const quoteDecimals = unpackMint(
    quoteMint,
    accountInfo_quote,
    quoteTokenProgramId
  ).decimals;

  const associatedPoolKeys = await Liquidity.getAssociatedPoolKeys({
    version: 4,
    marketVersion: 3,
    baseMint,
    quoteMint,
    baseDecimals,
    quoteDecimals,
    marketId: new PublicKey(market_id),
    programId: MAINNET_PROGRAM_ID.AmmV4,
    marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
  });
  const { id: ammId, lpMint } = associatedPoolKeys;
  console.log("AMM ID: ", ammId.toString());
  console.log("lpMint: ", lpMint.toString());

  let quote_amount = quote_Mint_amount * 10 ** quoteDecimals;
  // -------------------------------------- Get balance
  let base_balance: number;
  let quote_balance: number;

  if (baseMint.toString() == "So11111111111111111111111111111111111111112") {
    base_balance = await connection.getBalance(LP_wallet_keypair.publicKey);
    if (!base_balance) return;
    console.log("SOL Balance:", base_balance);
  } else {
    const temp = await getTokenAccountBalance(
      connection,
      LP_wallet_keypair.publicKey.toString(),
      baseMint.toString()
    );
    base_balance = temp || 0;
  }

  if (quoteMint.toString() == "So11111111111111111111111111111111111111112") {
    quote_balance = await connection.getBalance(LP_wallet_keypair.publicKey);
    if (!quote_balance) return;
    console.log("SOL Balance:", quote_balance);
    assert(
      quote_amount <= quote_balance,
      "Sol LP input is greater than current balance"
    );
  } else {
    const temp = await getTokenAccountBalance(
      connection,
      LP_wallet_keypair.publicKey.toString(),
      quoteMint.toString()
    );
    quote_balance = temp || 0;
  }

  let base_amount_input = Math.ceil(
    base_balance * input_baseMint_tokens_percentage
  );

  let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;

  // step2: init new pool (inject money into the created pool)
  const lp_ix = await build_create_pool_instructions(
    MAINNET_PROGRAM_ID,
    market_id,
    LP_wallet_keypair,
    tokenAccountRawInfos_LP,
    baseMint,
    baseDecimals,
    quoteMint,
    quoteDecimals,
    delay_pool_open_time,
    base_amount_input,
    quote_amount,
    lookupTableCache
  );
  const lp_tx = (await buildSimpleTransaction({
    connection,
    makeTxVersion,
    payer: LP_wallet_keypair.publicKey,
    innerTransactions: lp_ix,
    addLookupTableInfo: addLookupTableInfo,
    recentBlockhash: blockhash,
  })) as VersionedTransaction[];
  lp_tx[0].sign([LP_wallet_keypair]);

  console.log("-------- pool creation instructions [DONE] ---------\n");

  // -------------------------------------------------
  // ---- Swap info
  const targetPoolInfo = {
    id: associatedPoolKeys.id.toString(),
    baseMint: associatedPoolKeys.baseMint.toString(),
    quoteMint: associatedPoolKeys.quoteMint.toString(),
    lpMint: associatedPoolKeys.lpMint.toString(),
    baseDecimals: associatedPoolKeys.baseDecimals,
    quoteDecimals: associatedPoolKeys.quoteDecimals,
    lpDecimals: associatedPoolKeys.lpDecimals,
    version: 4,
    programId: associatedPoolKeys.programId.toString(),
    authority: associatedPoolKeys.authority.toString(),
    openOrders: associatedPoolKeys.openOrders.toString(),
    targetOrders: associatedPoolKeys.targetOrders.toString(),
    baseVault: associatedPoolKeys.baseVault.toString(),
    quoteVault: associatedPoolKeys.quoteVault.toString(),
    withdrawQueue: associatedPoolKeys.withdrawQueue.toString(),
    lpVault: associatedPoolKeys.lpVault.toString(),
    marketVersion: 3,
    marketProgramId: associatedPoolKeys.marketProgramId.toString(),
    marketId: associatedPoolKeys.marketId.toString(),
    marketAuthority: associatedPoolKeys.marketAuthority.toString(),
    marketBaseVault: marketBaseVault.toString(),
    marketQuoteVault: marketQuoteVault.toString(),
    marketBids: marketBids.toString(),
    marketAsks: marketAsks.toString(),
    marketEventQueue: marketEventQueue.toString(),
    lookupTableAccount: PublicKey.default.toString(),
  };

  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo) as LiquidityPoolKeys;
  console.log("\n -------- Now getting swap instructions --------");

  const TOKEN_TYPE = new Token(
    TOKEN_PROGRAM_ID,
    baseMint,
    baseDecimals,
    "ABC",
    "ABC"
  );

  const minAmountOut = new TokenAmount(TOKEN_TYPE, parseBigNumberish(ONE));

  // console.log("Swap wsol [Lamports]: ", inputTokenAmount.raw.words[0]);
  // console.log("Min Amount Out[Lamports]: ", minAmountOut.raw.words[0]);
  const swapWallets = Object.values(swapWalletsConfig);
  const swapTransactions = [] as (VersionedTransaction | Transaction)[];
  for (let i = 0; i < swapWallets.length; i += 1) {
    const wallet = swapWallets[i];
    const tokenAccountRawInfos_Swap = await getWalletTokenAccount(
      connection,
      wallet.keypair!.publicKey
    );

    const inputTokenAmount = new TokenAmount(
      DEFAULT_TOKEN.WSOL,
      wallet.swapAmount
        ? wallet.swapAmount * 10 ** quoteDecimals
        : swap_sol_amount * 10 ** quoteDecimals
    );

    const swap_ix = await build_swap_instructions(
      connection,
      poolKeys,
      tokenAccountRawInfos_Swap,
      wallet.keypair,
      inputTokenAmount,
      minAmountOut
    );
    const swap_tx = await buildSimpleTransaction({
      connection,
      makeTxVersion,
      payer: wallet.keypair!.publicKey,
      innerTransactions: swap_ix,
      recentBlockhash: blockhash,
    });
    // not sure why keypair isn't type compatible here
    swap_tx[0].sign([wallet.keypair] as unknown as Signer[] & Signer);
    swapTransactions.push(swap_tx[0]);
  }

  console.log("-------- swap coin instructions [DONE] ---------\n");

  // swap ix end ------------------------------------------------------------

  console.log(
    "Please wait for 30 seconds for bundle to be completely executed by all nearest available leaders!"
  );

  const transactions = [...lp_tx, ...swapTransactions];

  let success;
  while (success !== 1) {
    //@ts-ignore
    success = await sendBundle(transactions, create_pool_fees);
  }

  while (true) {
    try {
      await monitor_both(poolKeys, swapWalletsConfig);
    } catch {}
  }
}

txCreateAndInitNewPool();

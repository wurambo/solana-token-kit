import { Keypair, PublicKey } from "@solana/web3.js";
import {
  buildAndSendTx,
  build_swap_instructions,
} from "./utils/build_a_sendtxn";
import { DEFAULT_TOKEN, connection } from "../config/config";
import {
  MARKET_STATE_LAYOUT_V3,
  Liquidity,
  MAINNET_PROGRAM_ID,
  jsonInfo2PoolKeys,
  LiquidityPoolKeys,
  ONE,
  TokenAmount,
  parseBigNumberish,
  TOKEN_PROGRAM_ID,
  Token,
} from "@raydium-io/raydium-sdk";
import { unpackMint } from "@solana/spl-token";
import { getWalletTokenAccountMint } from "./utils/get_balance";
import { delay } from "./utils/helpers";

const MARKET_ID = new PublicKey("");
const DEFAULT_AMOUNTS_TO_SNIPE = [
  0.01, 0.025, 0.03, 0.015,
  //0.001,
  // 1_000_000_000, 500_000_000, 750_000_000, 100_000_000, 10_000_000,
];
const TIME_BETWEEN_SNIPES = 400; // ms
const WALLETS = {
  "0": {
    phrase: "",
    privateKey: "",
    publicKey: "",
  },
};

const fakeSnipe = async () => {
  const marketBufferInfo = await connection.getAccountInfo(MARKET_ID);
  if (!marketBufferInfo) {
    console.log("No market info found. Exiting");
    return;
  }

  const {
    baseMint,
    quoteMint,
    baseVault: marketBaseVault,
    quoteVault: marketQuoteVault,
    bids: marketBids,
    asks: marketAsks,
    eventQueue: marketEventQueue,
  } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo.data);

  const accountInfo_base = await connection.getAccountInfo(baseMint);
  if (!accountInfo_base) {
    console.log("No account info found. Exiting");
    return;
  }
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
    marketId: new PublicKey(MARKET_ID),
    programId: MAINNET_PROGRAM_ID.AmmV4,
    marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
  });
  const { id: ammId, lpMint } = associatedPoolKeys;
  console.log("AMM ID: ", ammId.toString());

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
  const TOKEN_TYPE = new Token(
    TOKEN_PROGRAM_ID,
    baseMint,
    baseDecimals,
    "ABC",
    "ABC"
  );
  const minAmountOut = new TokenAmount(TOKEN_TYPE, parseBigNumberish(ONE));

  while (true) {
    const wallets = Object.values(WALLETS);

    for (let i = 0; i < wallets.length; i += 1) {
      try {
        const wallet = wallets[i];
        const keypair = Keypair.fromSecretKey(
          new Uint8Array(JSON.parse(wallet.privateKey))
        );

        // picks a random value from list of amounts
        const amountToSnipe =
          DEFAULT_AMOUNTS_TO_SNIPE[
            Math.floor(Math.random() * wallets.length)
          ] ?? DEFAULT_AMOUNTS_TO_SNIPE[0];
        const inputTokenAmount = new TokenAmount(
          DEFAULT_TOKEN.WSOL,
          amountToSnipe * 10 ** quoteDecimals
        );

        const tokenAccountRawInfos_Swap = await getWalletTokenAccountMint(
          connection,
          keypair.publicKey,
          baseMint
        );

        const swap_ix = await build_swap_instructions(
          connection,
          poolKeys,
          tokenAccountRawInfos_Swap,
          keypair,
          inputTokenAmount,
          minAmountOut
        );

        const sendTx = await buildAndSendTx(keypair, swap_ix, {
          skipPreflight: true,
          maxRetries: 30,
        });

        console.log("Transaction ID: ", sendTx);
      } catch (error) {
        console.log("Should error, continue", error);
      }
    }

    // wait before trying transactions again
    delay(TIME_BETWEEN_SNIPES);
  }
};

fakeSnipe();

import { getPoolKeys } from "./utils/getPoolKeys";
import {
  DEFAULT_TOKEN,
  addLookupTableInfo,
  connection,
  makeTxVersion,
  market_id,
} from "../config/config";
import {
  Liquidity,
  LiquidityPoolKeysV4,
  ONE,
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
  buildSimpleTransaction,
  parseBigNumberish,
} from "@raydium-io/raydium-sdk";
import { getTokenBalanceWallets } from "./utils/wallet";
import {
  Keypair,
  Signer,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Wallets } from "./types/wallet";
import { build_swap_instructions } from "./utils/build_a_sendtxn";
import { getATAAddress, getWalletTokenAccount } from "./utils/get_balance";
import { percentAmount } from "./utils/percentAmount";
import { sendBundle } from "./utils/jitoBundle/sendBundle";
import { delay } from "./utils/helpers";

const JITO_TIPS = 10_000;
const WALLETS = {
  "0": {
    phrase: "",
    privateKey: "",
    publicKey: "",
  },
};

export const startVolumeBot = async () => {
  let wallets = { ...WALLETS } as Wallets;

  Object.entries(WALLETS).forEach(
    ([key, value]) =>
      (wallets[key] = {
        ...wallets[key],
        keypair: Keypair.fromSecretKey(
          new Uint8Array(JSON.parse(value.privateKey))
        ),
      })
  );

  // figure out which wallets are buy wallets
  const poolKeys = (await getPoolKeys(market_id)) as LiquidityPoolKeysV4;
  const { baseDecimals, baseMint, quoteDecimals } = poolKeys;
  const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
  const TOKEN_TYPE = new Token(
    TOKEN_PROGRAM_ID,
    baseMint,
    baseDecimals,
    "ABC",
    "ABC"
  );
  const minAmountOut = new TokenAmount(TOKEN_TYPE, parseBigNumberish(ONE));

  wallets = await getTokenBalanceWallets(poolInfo, poolKeys, wallets);
  const walletsList = Object.values(wallets);

  const sellWallets = walletsList.filter((wallet) => wallet.swapWorth! > 0);
  const buyWallets = walletsList.filter((wallet) => !wallet.swapWorth);

  // start volume bot
  while (true) {
    try {
      const swapTransactions = [] as (VersionedTransaction | Transaction)[];
      let blockhash = (await connection.getLatestBlockhash("finalized"))
        .blockhash;

      // buy transactions
      for (let i = 0; i < 1; i += 1) {
        const wallet = buyWallets[i];
        console.log("Wallet buy: ", wallet.publicKey);
        const pairedSellWallet = sellWallets[i];
        const tokenAccountRawInfos_Swap = await getWalletTokenAccount(
          connection,
          wallet.keypair!.publicKey
        );

        const inputTokenAmount = new TokenAmount(
          DEFAULT_TOKEN.WSOL,
          pairedSellWallet.swapWorth! * 10 ** quoteDecimals
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

      // sell transactions
      for (let i = 0; i < 1; i += 1) {
        const wallet = sellWallets[i];
        console.log("Wallet sell: ", wallet.publicKey);
        const tokenAccountRawInfos_Swap = await getWalletTokenAccount(
          connection,
          wallet.keypair!.publicKey
        );

        const swapToken = new Token(
          TOKEN_PROGRAM_ID,
          poolKeys.baseMint,
          poolKeys.baseDecimals
        );
        const swapTokenAccount = getATAAddress(
          TOKEN_PROGRAM_ID,
          wallet.keypair!.publicKey,
          poolKeys.baseMint
        );
        let swap_account_balance1 = await connection.getTokenAccountBalance(
          swapTokenAccount.publicKey
        );
        const percentBalance = percentAmount(
          swap_account_balance1.value.amount,
          1
        );
        let inputTokenAmount = new TokenAmount(swapToken, percentBalance);
        const minAmountOut = new TokenAmount(
          DEFAULT_TOKEN.WSOL,
          parseBigNumberish(ONE)
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
          addLookupTableInfo: addLookupTableInfo,
        });
        // not sure why keypair isn't type compatible here
        swap_tx[0].sign([wallet.keypair] as unknown as Signer[] & Signer);
        swapTransactions.push(swap_tx[0]);
      }

      // buy transactions
      for (let i = 1; i < 2; i += 1) {
        const wallet = buyWallets[i];
        console.log("Wallet buy: ", wallet.publicKey);
        const pairedSellWallet = sellWallets[i];
        const tokenAccountRawInfos_Swap = await getWalletTokenAccount(
          connection,
          wallet.keypair!.publicKey
        );

        const inputTokenAmount = new TokenAmount(
          DEFAULT_TOKEN.WSOL,
          pairedSellWallet.swapWorth! * 10 ** quoteDecimals
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

      // sell transactions
      for (let i = 1; i < 2; i += 1) {
        const wallet = sellWallets[i];
        console.log("Wallet sell: ", wallet.publicKey);
        const tokenAccountRawInfos_Swap = await getWalletTokenAccount(
          connection,
          wallet.keypair!.publicKey
        );

        const swapToken = new Token(
          TOKEN_PROGRAM_ID,
          poolKeys.baseMint,
          poolKeys.baseDecimals
        );
        const swapTokenAccount = getATAAddress(
          TOKEN_PROGRAM_ID,
          wallet.keypair!.publicKey,
          poolKeys.baseMint
        );
        let swap_account_balance1 = await connection.getTokenAccountBalance(
          swapTokenAccount.publicKey
        );
        const percentBalance = percentAmount(
          swap_account_balance1.value.amount,
          1
        );
        let inputTokenAmount = new TokenAmount(swapToken, percentBalance);
        const minAmountOut = new TokenAmount(
          DEFAULT_TOKEN.WSOL,
          parseBigNumberish(ONE)
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
          addLookupTableInfo: addLookupTableInfo,
        });
        // not sure why keypair isn't type compatible here
        swap_tx[0].sign([wallet.keypair] as unknown as Signer[] & Signer);
        swapTransactions.push(swap_tx[0]);
      }

      //@ts-ignore
      const status = await sendBundle(swapTransactions, JITO_TIPS);

      if (status == 1) {
        const buyWallet0 = buyWallets.shift();
        const buyWallet1 = buyWallets.shift();
        const sellWallet0 = sellWallets.shift();
        const sellWallet1 = sellWallets.shift();
        buyWallets.push(sellWallet0!);
        buyWallets.push(sellWallet1!);
        sellWallets.push(buyWallet0!);
        sellWallets.push(buyWallet1!);
      } else {
        console.log("Bundle may not have processed. Trying again...");
      }
    } catch (error) {
      console.log("Error. Trying again...", error);
    }
    delay(1000);
  }
};

startVolumeBot();

import * as readline from "readline";
import { logger } from "./logger";
import {
  sell_swap_tokens_percentage,
  DEFAULT_TOKEN,
  LP_remove_tokens_percentage,
  sell_swap_take_profit_ratio,
  swap_sol_amount,
  LP_remove_tokens_take_profit_at_sol,
  connection,
  slippage,
} from "../../config/config";
import { Liquidity } from "@raydium-io/raydium-sdk";
import { ammRemoveLiquidity } from "./removeLiquidity";
import { sell_swap } from "./sellToken";
import { Wallets } from "../types/wallet";
import { getTokenBalanceWallets, updateTokenBalanceWallets } from "./wallet";
import { delay } from "./helpers";

let userInput = "";

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const getTokensWorth = async (
  poolKeys,
  inputTokenAmount,
  outputToken,
  slippage,
  poolInfo
) => {
  const { amountOut } = Liquidity.computeAmountOut({
    poolKeys: poolKeys,
    poolInfo,
    amountIn: inputTokenAmount,
    currencyOut: outputToken,
    slippage: slippage,
  });
  return Number(amountOut.raw) / 10 ** amountOut.currency.decimals;
};

export async function monitor_both(poolKeys, wallets: Wallets) {
  userInput = "";

  const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

  wallets = await getTokenBalanceWallets(poolInfo, poolKeys, wallets);
  let swapWorths = Object.entries(wallets)
    .map(([key, wallet]) => ({ ...wallet, id: key }))
    .sort((a, b) => b.swapWorth - a.swapWorth);
  let maxSwapWorth = Math.max(0, swapWorths[0].swapWorth);
  let minSwapWorth = Math.min(0, swapWorths[swapWorths.length - 1].swapWorth);

  // Listen for user input
  rl.on("line", (input) => {
    userInput = input;
  });

  while (true) {
    try {
      let LP_worth =
        (await connection.getBalance(poolKeys.quoteVault)) /
        10 ** poolKeys.quoteDecimals;

      logger.info(
        `LP Worth: ${LP_worth} SOL | ${Object.entries(wallets)
          .map(
            ([key, wallet]) =>
              `Wallet ${key} worth: ${wallet.swapWorth.toFixed(3)} SOL`
          )
          .join(" | ")}`
      );

      if (userInput == "stop") {
      } else if (userInput == "restart") {
        return;
      } else if (userInput == "balance") {
        wallets = await updateTokenBalanceWallets(poolInfo, poolKeys, wallets);
        let swapWorths = Object.entries(wallets)
          .map(([key, wallet]) => ({ ...wallet, id: key }))
          .sort((a, b) => b.swapWorth - a.swapWorth);
        maxSwapWorth = Math.max(0, swapWorths[0].swapWorth);
        minSwapWorth = Math.min(0, swapWorths[swapWorths.length - 1].swapWorth);

        logger.info(
          `LP Worth: ${LP_worth} SOL | ${Object.entries(wallets)
            .map(
              ([key, wallet]) =>
                `Wallet ${key} worth: ${wallet.swapWorth.toFixed(3)} SOL`
            )
            .join(" | ")}`
        );
        return;
      } else if (userInput.startsWith("sell")) {
        const userInputParts = userInput.split(" ");

        if (userInputParts.length < 2) {
          console.log("Did not specify wallet. Selling all wallets");
          Object.entries(wallets).forEach(async ([key, wallet]) => {
            if (wallet.swapWorth > 0) {
              console.log(
                `Selling wallet ${key}: ${wallet.swapWorth.toFixed(3)} SOL`
              );
              await sell_swap(
                poolKeys,
                sell_swap_tokens_percentage,
                wallet.keypair
              );
            }
          });
        }

        const key = userInputParts?.[1];
        const swapWallet = wallets[userInputParts?.[1]];
        if (swapWallet?.swapWorth > 0) {
          console.log(
            `Selling wallet ${key}: ${swapWallet.swapWorth.toFixed(3)} SOL`
          );
          await sell_swap(poolKeys, 1, swapWallet.keypair);
        } else {
          console.log(
            `No value in wallet ${userInputParts?.[1]}. Ignoring sell command.`
          );
        }
        let swapWorths = Object.entries(wallets)
          .map(([key, wallet]) => ({ ...wallet, id: key }))
          .sort((a, b) => b.swapWorth - a.swapWorth);
        maxSwapWorth = Math.max(0, swapWorths[0].swapWorth);
        minSwapWorth = Math.min(0, swapWorths[swapWorths.length - 1].swapWorth);
        return;
      } else if (userInput.includes("remove")) {
        await ammRemoveLiquidity(poolKeys, 1, false);
        return;
      } else if (userInput.includes("rug") || userInput.includes("jeet")) {
        await ammRemoveLiquidity(poolKeys, 1);
        return;
      }

      let swap_limit = sell_swap_take_profit_ratio * swap_sol_amount;

      // if (LP_worth >= LP_remove_tokens_take_profit_at_sol) {
      //   await ammRemoveLiquidity(poolKeys, LP_remove_tokens_percentage);
      //   return;
      // }
      // if (minSwapWorth >= swap_limit) {
      //   Object.values(wallets).forEach(async (wallet) => {
      //     await sell_swap(
      //       poolKeys,
      //       sell_swap_tokens_percentage,
      //       wallet.keypair
      //     );
      //   });
      //   wallets = await updateTokenBalanceWallets(poolInfo, poolKeys, wallets);
      //   swapWorths = Object.values(wallets).map((wallet) => wallet.swapWorth);
      //   maxSwapWorth = Math.max(0, ...swapWorths);
      //   minSwapWorth = Math.min(0, ...swapWorths);
      //   return;
      // }
    } catch (e: unknown) {}

    await delay(2000);
  }
}

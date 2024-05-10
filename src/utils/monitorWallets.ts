import * as readline from "readline";
import { logger } from "./logger";
import { sell_swap_tokens_percentage, connection } from "../../config/config";
import { Liquidity } from "@raydium-io/raydium-sdk";
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

export const monitorWallets = async (poolKeys, wallets: Wallets) => {
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
      const sum = swapWorths.reduce((prev, cur) => prev + cur.swapWorth, 0);
      logger.info(`Total wallets worth: ${sum} SOL`);
      logger.info(
        `Top 5 wallets: ${swapWorths
          .slice(0, 5)
          .map(
            (wallet) => `${wallet.id} worth: ${wallet.swapWorth.toFixed(3)} SOL`
          )
          .join(" | ")}`
      );

      if (userInput == "stop") {
      } else if (userInput == "restart") {
        return;
      } else if (userInput == "balance") {
        wallets = await updateTokenBalanceWallets(poolInfo, poolKeys, wallets);
        swapWorths = Object.entries(wallets)
          .map(([key, wallet]) => ({ ...wallet, id: key }))
          .sort((a, b) => b.swapWorth - a.swapWorth);
        maxSwapWorth = Math.max(0, swapWorths[0].swapWorth);
        minSwapWorth = Math.min(0, swapWorths[swapWorths.length - 1].swapWorth);

        logger.info(
          `${Object.entries(wallets)
            .map(
              ([key, wallet]) =>
                `Wallet ${key} Worth: ${wallet.swapWorth.toFixed(3)} SOL`
            )
            .join(" | ")}`
        );
        return;
      } else if (userInput.startsWith("sell")) {
        const userInputParts = userInput.split(" ");

        if (userInputParts.length < 2) {
          console.log("Did not specify wallet. Selling 10 wallets");
          let swaps = 0;
          Object.entries(wallets).forEach(async ([key, wallet]) => {
            if (wallet.swapWorth > 0) {
              if (swaps > 0 && swaps % 10 == 0) {
                await delay(1000);
              }
              swaps += 1;
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

        for (let i = 1; i < userInputParts.length; i += 1) {
          const key = userInputParts[i];
          const swapWallet = wallets[key];
          if (swapWallet?.swapWorth > 0) {
            console.log(
              `Selling wallet ${key}: ${swapWallet.swapWorth.toFixed(3)} SOL`
            );
            await sell_swap(poolKeys, 1, swapWallet.keypair);
          } else {
            console.log(
              `No value in wallet ${key} or invalid key. Ignoring sell for ${key}.`
            );
          }
        }
        wallets = await updateTokenBalanceWallets(poolInfo, poolKeys, wallets);
        swapWorths = Object.entries(wallets)
          .map(([key, wallet]) => ({ ...wallet, id: key }))
          .sort((a, b) => b.swapWorth - a.swapWorth);
        maxSwapWorth = Math.max(0, swapWorths[0].swapWorth);
        minSwapWorth = Math.min(0, swapWorths[swapWorths.length - 1].swapWorth);
        return;
      }
    } catch (e: unknown) {}

    await delay(2000);
  }
};

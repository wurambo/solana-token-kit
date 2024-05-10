import {
  Liquidity,
  LiquidityPoolInfo,
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
} from "@raydium-io/raydium-sdk";
import { connection, DEFAULT_TOKEN, slippage } from "../../config/config";
import { swapWallets } from "../../config/config-swap-wallets";
import { Wallets } from "../types/wallet";
import { getWalletTokenAccountMint } from "./get_balance";

export const getTokenBalanceWallets = async (
  poolInfo: LiquidityPoolInfo,
  poolKeys,
  wallets: Wallets
): Promise<Wallets> => {
  const updatedWallets = { ...wallets };

  const walletKeys = Object.keys(wallets);
  for (let i = 0; i < walletKeys.length; i += 1) {
    const key = walletKeys[i];
    const wallet = wallets[key];

    let tokenAccountRawInfos_Swap = await getWalletTokenAccountMint(
      connection,
      wallet.keypair.publicKey,
      poolKeys.baseMint
    );
    let swap_token_account_balance;
    wallet.swapTokenKey = tokenAccountRawInfos_Swap[0]?.pubkey;

    swap_token_account_balance =
      tokenAccountRawInfos_Swap[0]?.accountInfo?.amount ?? 0;
    const TOKEN_TYPE2 = new Token(
      TOKEN_PROGRAM_ID,
      poolKeys.baseMint,
      poolKeys.baseDecimals,
      "ABC",
      "ABC"
    );
    const inputTokenAmount = new TokenAmount(
      TOKEN_TYPE2,
      swap_token_account_balance
    );
    wallet.inputTokenAmount = inputTokenAmount;

    const swapWorth = await getTokensWorth(
      poolKeys,
      wallet.inputTokenAmount,
      DEFAULT_TOKEN.WSOL,
      slippage,
      poolInfo
    );
    wallet.swapWorth = swapWorth;

    swapWallets[key] = wallet;
  }

  return updatedWallets;
};

export const updateTokenBalanceWallets = async (
  poolInfo,
  poolKeys,
  wallets: Wallets
): Promise<Wallets> => {
  const updatedWallets = { ...wallets };

  const walletKeys = Object.keys(wallets);
  for (let i = 0; i < walletKeys.length; i += 1) {
    const key = walletKeys[i];
    const wallet = wallets[key];
    const swapWorth = await getTokensWorth(
      poolKeys,
      wallet.inputTokenAmount,
      DEFAULT_TOKEN.WSOL,
      slippage,
      poolInfo
    );
    swapWallets[key].swapWorth = swapWorth;
  }

  return updatedWallets;
};

export const getTokensWorth = async (
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

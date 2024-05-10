import {
  MARKET_STATE_LAYOUT_V3,
  Liquidity,
  MAINNET_PROGRAM_ID,
  LiquidityPoolKeys,
  jsonInfo2PoolKeys,
} from "@raydium-io/raydium-sdk";
import { unpackMint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { connection, market_id } from "../../config/config";

export const getPoolKeys = async (marketID) => {
  const marketBufferInfo = await connection.getAccountInfo(marketID);
  if (!marketBufferInfo) return;
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

  return poolKeys;
};

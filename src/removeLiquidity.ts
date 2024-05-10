import { market_id } from "../config/config";
import { ammRemoveLiquidity } from "./utils/removeLiquidity";
import { getPoolKeys } from "./utils/getPoolKeys";

const removeLiquidity = async () => {
  const poolKeys = await getPoolKeys(market_id);

  console.log("Attempting to remove liquidity.");
  await ammRemoveLiquidity(poolKeys, 1);
  console.log("Liquidity removal complete.");
};

removeLiquidity();

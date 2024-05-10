import { LP_wallet_keypair, market_id } from "../config/config";
import { burnToken } from "./utils/burnToken";
import { getPoolKeys } from "./utils/getPoolKeys";

const MARKET_ID = market_id;
const WALLET = LP_wallet_keypair;

export const burnLPToken = async () => {
  const poolKeys = await getPoolKeys(MARKET_ID);
  if (!poolKeys) {
    console.log("No pool info found on market.");
    return;
  }
  console.log(`Burning LP Token (${poolKeys.lpMint.toString()})...`);
  await burnToken(poolKeys.lpMint, WALLET);
  console.log("Token burned. Exiting.");
};

burnLPToken();

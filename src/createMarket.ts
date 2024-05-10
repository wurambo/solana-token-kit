import { createMarket } from "./utils/createMarket";
import { LP_wallet_keypair } from "../config/config";
import { PublicKey } from "@solana/web3.js";
import * as token from "../config/config-created-token-address.json";

const createMarketAndListPoolID = async () => {
  await createMarket(LP_wallet_keypair, new PublicKey(token.mintAddress));
  console.log("Market finished creating. Copy Market ID to config.ts");
};

createMarketAndListPoolID();

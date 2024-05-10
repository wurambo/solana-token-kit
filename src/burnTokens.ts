import { PublicKey } from "@solana/web3.js";
import { swap_wallet_keypair } from "../config/config";
import { burnToken } from "./utils/burnToken";

const WALLET = swap_wallet_keypair;
const TOKENS = [""];

export const burnTokens = async () => {
  for (const token of TOKENS) {
    const publicKey = new PublicKey(token);
    console.log(`Burning Token ${publicKey}...`);
    await burnToken(publicKey, WALLET);
    console.log("Token burned.");
  }

  console.log("All tokens burned. Exiting.");
};

burnTokens();

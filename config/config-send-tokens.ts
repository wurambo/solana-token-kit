import { Keypair, PublicKey } from "@solana/web3.js";

export const tokenAddress = new PublicKey("");

const SENDER_KEY = [];

// sendWallets to send to
export const sendWallets = [];

export const senderWallet = Keypair.fromSecretKey(new Uint8Array(SENDER_KEY));

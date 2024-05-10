import { TokenAmount } from "@raydium-io/raydium-sdk";
import { Keypair, PublicKey } from "@solana/web3.js";

export interface Wallet {
  // config props
  keypair?: Keypair;
  swapAmount?: number;
  phrase?: string;
  privateKey?: string;
  publicKey?: string;
  // internal props
  balance?: number;
  inputTokenAmount?: TokenAmount;
  swapTokenKey?: PublicKey;
  swapWorth?: number;
}

export interface Wallets {
  [id: string]: Wallet;
}

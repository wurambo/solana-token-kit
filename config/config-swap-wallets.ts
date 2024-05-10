import {
  swap1_wallet_keypair,
  swap2_wallet_keypair,
  swap_wallet_keypair,
} from "./config";
import { Wallets } from "../src/types/wallet";

export const swapWallets: Wallets = {
  ["0"]: {
    keypair: swap_wallet_keypair,
    // swapAmount: 8,
  },
  ["1"]: {
    keypair: swap2_wallet_keypair,
    // swapAmount: .001,
  },
  ["2"]: {
    keypair: swap1_wallet_keypair,
    // swapAmount: .001,
  },
};

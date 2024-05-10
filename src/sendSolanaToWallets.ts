import { swap_wallet_keypair } from "../config/config";
import { sendSolana } from "./utils/sendSolana";

const SENDER_WALLET = swap_wallet_keypair;
const SEND_AMOUNT = 100_000_000;
const WALLETS_PER_BUNDLE = 20;
const WALLETS = {
  "0": {
    phrase: "",
    privateKey: "",
    publicKey: "",
  },
};

export const sendSolanaToWallets = async () => {
  const wallets = Object.values(WALLETS).map((wallet) => wallet["publicKey"]);

  console.log(
    `Sending ${SEND_AMOUNT / 1_000_000_000} SOL to ${wallets.join(", ")}`
  );

  // send token to batches of wallets
  for (let i = 0; i < wallets.length; i += WALLETS_PER_BUNDLE) {
    const walletsToSend = wallets.slice(i, i + WALLETS_PER_BUNDLE);
    await sendSolana(SENDER_WALLET, walletsToSend, SEND_AMOUNT);
  }

  console.log("Sent.");
};

sendSolanaToWallets();

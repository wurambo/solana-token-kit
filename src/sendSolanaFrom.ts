import { Keypair, PublicKey } from "@solana/web3.js";
import { connection } from "../config/config";
import { Wallet } from "./types/wallet";
import { sendSolanaFrom } from "./utils/sendSolanaFrom";

const RECEIVING_WALLET = new PublicKey("");
// TODO - can only send 1 at a time
const WALLETS_PER_BUNDLE = 1;
const WALLETS = {
  "0": {
    phrase: "",
    privateKey: "",
    publicKey: "",
  },
};

const sendSolanaFromCreatedWallets = async () => {
  const wallets = Object.values(WALLETS).map((wallet) => ({
    ...wallet,
    keypair: Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(wallet.privateKey))
    ),
  })) as Wallet[];

  let sum = 0;
  // send token to batches of wallets
  for (let i = 0; i < wallets.length; i += WALLETS_PER_BUNDLE) {
    const walletsSlice = wallets.slice(i, i + WALLETS_PER_BUNDLE);
    const walletsToSend = [] as Wallet[];
    for (const wallet of walletsSlice) {
      const balance = await connection.getBalance(wallet.keypair!.publicKey);
      if (balance) {
        sum += balance;
        wallet.balance = balance;
        walletsToSend.push(wallet);
        console.log("Wallet balance: ", balance);
      }
    }

    if (walletsToSend.length) {
      await sendSolanaFrom(walletsToSend, RECEIVING_WALLET);
    }
  }
  console.log("Total sent:", sum);
};

sendSolanaFromCreatedWallets();

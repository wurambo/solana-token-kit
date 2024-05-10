import { PublicKey } from "@solana/web3.js";
import { sendToken } from "./utils/sendToken";
import { connection, swap_wallet_keypair } from "../config/config";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

const SENDER_KEYPAIR = swap_wallet_keypair;
const TOKEN_ADDRESS = new PublicKey("");
const WALLETS_PER_BUNDLE = 10;
const WALLETS = {
  "0": {
    phrase: "",
    privateKey: "",
    publicKey: "",
  },
};

const sendTokenToWallets = async () => {
  const wallets = Object.values(WALLETS).map(
    (wallet) => new PublicKey(wallet["publicKey"])
  );

  const totalBundles = Math.floor(wallets.length / WALLETS_PER_BUNDLE);

  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    SENDER_KEYPAIR,
    TOKEN_ADDRESS,
    SENDER_KEYPAIR.publicKey
  );
  const amountPerBatch = Number(
    senderTokenAccount.amount / BigInt(totalBundles)
  );

  // send token to batches of wallets
  for (let i = 0; i < wallets.length; i += WALLETS_PER_BUNDLE) {
    const walletsToSend = wallets.slice(i, i + WALLETS_PER_BUNDLE);

    console.log(
      `Sending tokens from ${SENDER_KEYPAIR.publicKey} to ${walletsToSend.join(
        ", "
      )}`
    );

    await sendToken(
      TOKEN_ADDRESS,
      SENDER_KEYPAIR,
      walletsToSend,
      amountPerBatch
    );
  }

  console.log("Finished sending token.");
};

sendTokenToWallets();

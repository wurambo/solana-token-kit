import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { sendBundle } from "./jitoBundle/sendBundle";
import { connection } from "../../config/config";
import { Wallet } from "../types/wallet";

const JITO_TIP_AMOUNT = 10_000;

export const sendSolanaFrom = async (
  wallets: Wallet[],
  receiver: PublicKey
) => {
  try {
    const sendSolanaTransaction = new Transaction();

    for (let i = 0; i < wallets.length; i += 1) {
      const wallet = wallets[i];

      const transferSolIx = await SystemProgram.transfer({
        fromPubkey: wallet.keypair!.publicKey,
        toPubkey: receiver,
        lamports: wallet.balance! - 5000,
      });
      sendSolanaTransaction.add(transferSolIx);
    }

    let blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    sendSolanaTransaction.feePayer = wallets[0].keypair!.publicKey;
    sendSolanaTransaction.recentBlockhash = blockhash;
    sendSolanaTransaction.sign(...wallets.map((wallet) => wallet.keypair!));

    await sendBundle([sendSolanaTransaction], JITO_TIP_AMOUNT);
  } catch (error) {
    console.log("error sending tokens: ", error);
  }
};

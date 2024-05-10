import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { sendBundle } from "./jitoBundle/sendBundle";
import { PublicKey } from "@solana/web3.js";
import { connection } from "../../config/config";

const JITO_TIP_AMOUNT = 10_000;

export const sendSolana = async (sender: Keypair, sendWallets, amount) => {
  try {
    const sendSolanaTransaction = new Transaction();

    for (let i = 0; i < sendWallets.length; i += 1) {
      const wallet = sendWallets[i];
      const receiverPubkey = new PublicKey(wallet); // solana wallet address

      const transferSolIx = await SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: receiverPubkey,
        lamports: amount,
      });
      sendSolanaTransaction.add(transferSolIx);
    }

    let blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    sendSolanaTransaction.feePayer = sender.publicKey;
    sendSolanaTransaction.recentBlockhash = blockhash;
    sendSolanaTransaction.sign(sender);

    await sendBundle([sendSolanaTransaction], JITO_TIP_AMOUNT);
  } catch (error) {
    console.log("error sending tokens: ", error);
  }
};

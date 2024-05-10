import { Keypair, Transaction } from "@solana/web3.js";
import { sendBundle } from "./jitoBundle/sendBundle";
import { PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { connection } from "../../config/config";

export const JITO_TIP_AMOUNT = 10_000;

const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

export const sendToken = async (
  tokenMintAddress,
  sender: Keypair,
  sendWallets: PublicKey[],
  amount: number
) => {
  try {
    const createNewTokenTransaction = new Transaction();

    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      sender,
      tokenMintAddress,
      sender.publicKey
    );

    let sum = amount ?? Number(senderTokenAccount.amount);

    for (let i = 0; i < sendWallets.length; i += 1) {
      const wallet = sendWallets[i];

      // amount to send to the wallet
      let walletAmount = randomNumber(
        (sum / sendWallets.length) * 0.87,
        (sum / sendWallets.length) * 1.13
      );

      sum = sum - walletAmount;

      // give the last wallet the remainder of the balance
      if (i == sendWallets.length - 1) {
        walletAmount = sum;
      }

      // generate token account
      const receiverTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        wallet
      );

      const createTokenAccountIx =
        await createAssociatedTokenAccountInstruction(
          sender.publicKey,
          receiverTokenAccount,
          wallet,
          tokenMintAddress
        );
      createNewTokenTransaction.add(createTokenAccountIx);

      const transferIx = await createTransferInstruction(
        senderTokenAccount.address,
        receiverTokenAccount,
        sender.publicKey,
        walletAmount,
        [sender]
      );
      createNewTokenTransaction.add(transferIx);
    }

    let blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    createNewTokenTransaction.feePayer = sender.publicKey;
    createNewTokenTransaction.recentBlockhash = blockhash;
    createNewTokenTransaction.sign(sender);

    await sendBundle([createNewTokenTransaction], JITO_TIP_AMOUNT);
  } catch (error) {
    console.log("error sending tokens: ", error);
  }
};

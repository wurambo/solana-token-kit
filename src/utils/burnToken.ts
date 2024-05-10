import { TOKEN_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import {
  createBurnInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { connection } from "../../config/config";
import { getATAAddress } from "./get_balance";
import { sendBundle } from "./jitoBundle/sendBundle";

const JITO_TIP_AMOUNT = 10_000;

export const burnToken = async (token: PublicKey, wallet: Keypair) => {
  try {
    const blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    const burnTransaction = new Transaction();
    const swapTokenAccount = getATAAddress(
      TOKEN_PROGRAM_ID,
      wallet.publicKey,
      token
    );
    const balance = await connection.getTokenAccountBalance(
      swapTokenAccount.publicKey
    );
    const amount = BigInt(balance.value.amount);

    const burnIx = await createBurnInstruction(
      swapTokenAccount.publicKey,
      token,
      wallet.publicKey,
      amount
    );
    burnTransaction.add(burnIx);

    const closeAccountIx = await createCloseAccountInstruction(
      swapTokenAccount.publicKey,
      wallet.publicKey,
      wallet.publicKey
    );
    burnTransaction.add(closeAccountIx);

    burnTransaction.feePayer = wallet.publicKey;
    burnTransaction.recentBlockhash = blockhash;
    burnTransaction.sign(wallet);

    let success;
    while (success !== 1) {
      success = await sendBundle([burnTransaction], JITO_TIP_AMOUNT);
    }
  } catch (error) {
    console.log("Error burning token:", error);
  }
};

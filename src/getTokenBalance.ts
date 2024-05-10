import { TOKEN_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { Keypair, PublicKey } from "@solana/web3.js";
import { connection } from "../config/config";
import { Wallets } from "./types/wallet";
import { getATAAddress } from "./utils/get_balance";

const TOKEN_ADDRESS = new PublicKey("");
const WALLETS = {
  "0": {
    phrase: "",
    privateKey: "",
    publicKey: "",
  },
};

const getTokenBalance = async () => {
  let wallets = { ...WALLETS } as Wallets;

  Object.entries(WALLETS).forEach(
    ([key, value]) =>
      (wallets[key] = {
        ...wallets[key],
        keypair: Keypair.fromSecretKey(
          new Uint8Array(JSON.parse(value.privateKey))
        ),
      })
  );
  Object.entries(wallets).forEach(async ([key, value]) => {
    const swapTokenAccount = getATAAddress(
      TOKEN_PROGRAM_ID,
      value.keypair.publicKey,
      TOKEN_ADDRESS
    );
    let balance = await connection.getTokenAccountBalance(
      swapTokenAccount.publicKey
    );
    console.log(`${key} amount: ${balance.value.uiAmountString}`);
  });
};

getTokenBalance();

import { Keypair } from "@solana/web3.js";
import { writeFile } from "node:fs";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { LP_wallet_keypair } from "../config/config";
import { sendSolana } from "./utils/sendSolana";
import { delay } from "./utils/helpers";

const NUMBER_OF_WALLETS = 2;
const LP_WALLET_SEND_AMOUNT = 12_000_000_000;
const BUY_WALLET_SEND_AMOUNT = 2_000_000_000;
const SENDER_WALLET = LP_wallet_keypair;

export const createWallets = async () => {
  const wallets = {};
  const walletPubKeys = [];
  let lpWalletPubKey;

  for (let i = 0; i < NUMBER_OF_WALLETS; i += 1) {
    const key = `wallet-${i}`;
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
    const keypair = Keypair.fromSeed(seed.subarray(0, 32));
    wallets[key] = {
      phrase: mnemonic,
      privateKey: `[${keypair.secretKey.toString()}]`,
      publicKey: keypair.publicKey.toString(),
      isLPWallet: i == 0,
    };

    // first wallet created is the LP wallet
    if (i == 0) {
      lpWalletPubKey = keypair.publicKey;
    } else {
      walletPubKeys.push(keypair.publicKey);
    }
  }

  await sendSolana(SENDER_WALLET, [lpWalletPubKey], LP_WALLET_SEND_AMOUNT);
  await sendSolana(SENDER_WALLET, walletPubKeys, BUY_WALLET_SEND_AMOUNT);

  writeFile(
    "config-created-wallets.json",
    JSON.stringify(wallets, null, "\t"),
    () => {}
  );
  // wait 1 second before exiting to ensure file gets written
  delay(1000);
};

createWallets();

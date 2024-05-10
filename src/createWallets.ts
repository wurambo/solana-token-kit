import { Keypair } from "@solana/web3.js";
import { writeFile } from "node:fs";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { delay } from "./utils/helpers";

const NUMBER_OF_WALLETS = 10;

export const createWallets = async () => {
  const wallets = {};

  for (let i = 0; i < NUMBER_OF_WALLETS; i += 1) {
    const key = `${i}`;
    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
    const keypair = Keypair.fromSeed(seed.subarray(0, 32));
    wallets[key] = {
      phrase: mnemonic,
      privateKey: `[${keypair.secretKey.toString()}]`,
      publicKey: keypair.publicKey.toString(),
    };
  }

  writeFile(
    "config/config-created-wallets.json",
    JSON.stringify(wallets, null, "\t"),
    () => {}
  );
  // wait 1 second before exiting to ensure file gets written
  delay(1000);
  console.log("Wallets created. Exiting.");
};

createWallets();

import { Keypair } from "@solana/web3.js";
import { market_id } from "../config/config";
import { monitorWallets } from "./utils/monitorWallets";
import { getPoolKeys } from "./utils/getPoolKeys";

const WALLETS = {
  "0": {
    phrase: "",
    privateKey: "",
    publicKey: "",
  },
};

const monitorTokenWallets = async () => {
  const wallets = { ...WALLETS };

  Object.entries(WALLETS).forEach(
    ([key, value]) =>
      (wallets[key] = {
        ...wallets[key],
        keypair: Keypair.fromSecretKey(
          new Uint8Array(JSON.parse(value.privateKey))
        ),
      })
  );

  const poolKeys = await getPoolKeys(market_id);
  while (true) {
    try {
      await monitorWallets(poolKeys, wallets);
    } catch {}
  }
};

monitorTokenWallets();

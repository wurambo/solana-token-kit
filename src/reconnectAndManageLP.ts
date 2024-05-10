import { market_id } from "../config/config";
import { swapWallets } from "../config/config-swap-wallets";
import { monitor_both } from "./utils/monitor";
import { getPoolKeys } from "./utils/getPoolKeys";

const reconnectAndManageLP = async () => {
  const poolKeys = await getPoolKeys(market_id);

  while (true) {
    try {
      await monitor_both(poolKeys, swapWallets);
    } catch {}
  }
};

reconnectAndManageLP();

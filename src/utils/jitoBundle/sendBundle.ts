import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { jito_auth_keypair, blockEngineUrl } from "../../../config/config";
import { searcherClient } from "jito-ts/dist/sdk/block-engine/searcher";
import { buildBundle, onBundleResult } from "./buildBundle";

export const sendBundle = async (
  transactions: Transaction[] | VersionedTransaction[],
  tip: number = 1_000_000
) => {
  var startTime = performance.now();

  const search = searcherClient(blockEngineUrl, jito_auth_keypair, {
    "grpc-node.max_session_memory": Number.MAX_SAFE_INTEGER,
  });
  console.log("Sending bundle...");

  const bundleID = await buildBundle(search, transactions, tip);

  let bundle_result = await onBundleResult(search, bundleID!);

  while (bundle_result !== -1 && bundle_result !== 1) {
    console.log(`Bundle still processing, checking bundle result again...`);

    bundle_result = await onBundleResult(search, bundleID!);
  }

  var endTime = performance.now();

  if (bundle_result == -1) {
    console.log("Bundle unsuccessful.");
  } else {
    console.log("Bundle successfully processed.");
  }
  console.log(
    `Bundle response time: ${Math.round(endTime - startTime) / 1000.0} seconds`
  );
  return bundle_result;
};

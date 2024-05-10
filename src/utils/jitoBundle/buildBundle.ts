import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { SearcherClient } from "jito-ts/dist/sdk/block-engine/searcher";
import { Bundle } from "jito-ts/dist/sdk/block-engine/types";
import { isError } from "jito-ts/dist/sdk/block-engine/utils";
import {
  wallet_2_pay_jito_fees_keypair,
  connection,
} from "../../../config/config";

export async function buildBundle(
  search: SearcherClient,
  transactions: VersionedTransaction[] | Transaction[],
  tip: number = 10_000
) {
  const _tipAccount = (await search.getTipAccounts())[0];
  const tipAccount = new PublicKey(_tipAccount);

  const bund = new Bundle([], Math.max(transactions.length + 1, 3));
  const resp = await connection.getLatestBlockhash("finalized");

  bund.addTransactions(...(transactions as VersionedTransaction[]));

  let maybeBundle = bund.addTipTx(
    wallet_2_pay_jito_fees_keypair,
    // jito tip (lamports)
    tip,
    tipAccount,
    resp.blockhash
  );

  if (isError(maybeBundle)) {
    throw maybeBundle;
  }

  try {
    const response_bund = await search.sendBundle(maybeBundle);
    console.log("bundle signature: ", response_bund);
    return response_bund;
  } catch (e) {
    console.error("error sending bundle: ", e);
  }
}

export const onBundleResult = (
  c: SearcherClient,
  bundleID: string
): Promise<number> => {
  let first = 0;
  let isResolved = false;

  return new Promise((resolve) => {
    // Set a timeout to reject the promise if no bundle is accepted within 5 seconds
    setTimeout(() => {
      if (!isResolved) {
        console.log(
          "Rejecting bundle - possible timeout. Possible the bundle ended up processing."
        );
        resolve(-1);
        isResolved = true;
      }
    }, 8000);

    c.onBundleResult(
      (result) => {
        if (result.bundleId == bundleID) {
          if (isResolved) return first;

          const isAccepted = result.accepted;
          const isRejected = result.rejected;
          if (isResolved == false) {
            if (isAccepted) {
              console.log(
                "bundle accepted, ID:",
                result.bundleId,
                " Slot: ",
                result.accepted?.slot
              );
              first += 1;
              isResolved = true;
              resolve(first); // Resolve with 'first' when a bundle is accepted
            }

            if (isRejected) {
              console.log("bundle is Rejected:", result);
              // Do not resolve or reject the promise here
            }
          }
        }
      },
      (e) => {
        console.error(e);
        // Do not reject the promise here
      }
    );
  });
};

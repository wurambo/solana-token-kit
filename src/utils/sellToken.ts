import { VersionedTransaction } from "@solana/web3.js";
import {
  ONE,
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
  buildSimpleTransaction,
  parseBigNumberish,
} from "@raydium-io/raydium-sdk";
import { buildAndSendTx, build_swap_instructions } from "./build_a_sendtxn";
import { getATAAddress, getWalletTokenAccount } from "./get_balance";
import { sendBundle } from "./jitoBundle/sendBundle";
import { logger } from "./logger";
import {
  DEFAULT_TOKEN,
  makeTxVersion,
  connection,
  addLookupTableInfo,
  sell_remove_fees,
} from "../../config/config";
import { percentAmount } from "./percentAmount";

export const sell_swap = async (
  poolKeys,
  percentage,
  wallet,
  shouldSendBundle = true
) => {
  try {
    const tokenAccountRawInfos_Swap = await getWalletTokenAccount(
      connection,
      wallet.publicKey
    );

    const swapToken = new Token(
      TOKEN_PROGRAM_ID,
      poolKeys.baseMint,
      poolKeys.baseDecimals
    );
    const swapTokenAccount = getATAAddress(
      TOKEN_PROGRAM_ID,
      wallet.publicKey,
      poolKeys.baseMint
    );
    let swap_account_balance1 = await connection.getTokenAccountBalance(
      swapTokenAccount.publicKey
    );
    const percentBalance = percentAmount(
      swap_account_balance1.value.amount,
      percentage
    );
    let inputTokenAmount = new TokenAmount(swapToken, percentBalance);
    const minAmountOut = new TokenAmount(
      DEFAULT_TOKEN.WSOL,
      parseBigNumberish(ONE)
    );

    const swap_ix = await build_swap_instructions(
      connection,
      poolKeys,
      tokenAccountRawInfos_Swap,
      wallet,
      inputTokenAmount,
      minAmountOut
    );

    if (shouldSendBundle) {
      const willSendTx = (await buildSimpleTransaction({
        connection,
        makeTxVersion,
        payer: wallet.publicKey,
        innerTransactions: swap_ix,
        addLookupTableInfo: addLookupTableInfo,
      })) as VersionedTransaction[];
      willSendTx[0].sign([wallet]);

      await sendBundle(willSendTx, sell_remove_fees);
      return;
    } else {
      while (true) {
        const txids = await buildAndSendTx(wallet, swap_ix, {
          skipPreflight: false,
          maxRetries: 30,
        });
        logger.info(`Sell - Signature ${txids[0]}`);
      }
    }
  } catch (e: unknown) {
    logger.info(`[SWAP - SELL - ERROR]: Trying again.`);
  }
};

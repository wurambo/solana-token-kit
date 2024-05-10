import {
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
  Liquidity,
  buildSimpleTransaction,
} from "@raydium-io/raydium-sdk";
import { VersionedTransaction } from "@solana/web3.js";
import {
  LP_wallet_keypair,
  connection,
  makeTxVersion,
  addLookupTableInfo,
} from "../../config/config";
import { sendBundle } from "./jitoBundle/sendBundle";
import { buildAndSendTx } from "./build_a_sendtxn";
import { getATAAddress, getWalletTokenAccount } from "./get_balance";
import { logger } from "./logger";
import { percentAmount } from "./percentAmount";

export const ammRemoveLiquidity = async (
  poolKeys,
  percentage,
  shouldSendBundle = true
) => {
  try {
    // create LP remove instructions -----------------------------------------
    const lpToken = new Token(
      TOKEN_PROGRAM_ID,
      poolKeys.lpMint,
      poolKeys.lpDecimals
    ); // LP
    const lpTokenAccount = getATAAddress(
      TOKEN_PROGRAM_ID,
      LP_wallet_keypair.publicKey,
      poolKeys.lpMint
    );
    // console.log("lpTokenAccount", lpTokenAccount.toString());
    let LP_account_balance1 = await connection.getTokenAccountBalance(
      lpTokenAccount.publicKey
    );
    // logger.info(
    //   `LP_account_balance Total: ${LP_account_balance1.value.amount}`
    // );
    const percentBalance = percentAmount(
      LP_account_balance1.value.amount,
      percentage
    );
    // console.log(
    //   `[Remove amount] LP_account_balance After Total: ${percentBalance}`
    // );
    let Amount_in = new TokenAmount(lpToken, percentBalance);

    const tokenAccountRawInfos_LP = await getWalletTokenAccount(
      connection,
      LP_wallet_keypair.publicKey
    );

    const lp_ix = await Liquidity.makeRemoveLiquidityInstructionSimple({
      connection,
      poolKeys,
      userKeys: {
        owner: LP_wallet_keypair.publicKey,
        tokenAccounts: tokenAccountRawInfos_LP,
      },
      amountIn: Amount_in,
      makeTxVersion,
    });

    if (shouldSendBundle) {
      const willSendTx = (await buildSimpleTransaction({
        connection,
        makeTxVersion,
        payer: LP_wallet_keypair.publicKey,
        innerTransactions: lp_ix.innerTransactions,
        addLookupTableInfo: addLookupTableInfo,
      })) as VersionedTransaction[];
      willSendTx[0].sign([LP_wallet_keypair]);
      await sendBundle(willSendTx);
      return;
    } else {
      while (true) {
        let txids = await buildAndSendTx(
          LP_wallet_keypair,
          lp_ix.innerTransactions,
          { skipPreflight: false, maxRetries: 30 }
          // error 3 invalid-argument bundle contains invalid signature :11111
        );
        logger.info(`REMOVE LP - Signature: ${txids[0]}`);
      }
    }
    // return txids[0];
  } catch (e: unknown) {
    logger.info(`[LP - REMOVE - ERROR]: Trying again.`);
  }
};

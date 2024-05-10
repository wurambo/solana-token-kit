import { Market } from "@openbook-dex/openbook";
import { MAINNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import * as web3 from "@solana/web3.js";
import { connection } from "../../config/config";

export const getPoolKeys = async (marketIDString) => {
  const rayV4 = new web3.PublicKey(MAINNET_PROGRAM_ID.AmmV4);
  const Amm_Authority = new web3.PublicKey(
    "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
  );
  const openbookProgram = new web3.PublicKey(
    MAINNET_PROGRAM_ID.OPENBOOK_MARKET
  );
  const serumProgramId = new web3.PublicKey(MAINNET_PROGRAM_ID.SERUM_MARKET);

  const withdrawQueue = web3.SystemProgram.programId;
  const lpVault = web3.SystemProgram.programId;

  const baseDecimal = 9;
  const quoteDecimal = 9;
  const rayVersion = 4;

  const marketID = new web3.PublicKey(marketIDString);

  async function getMarketInfo(marketID) {
    let marketInfo;
    while (true) {
      marketInfo = await connection.getAccountInfo(marketID);
      if (marketInfo) {
        break;
      }
    }
    return marketInfo;
  }

  function getDecodedData(marketInfo) {
    const decodedData = Market.getLayout(openbookProgram).decode(
      marketInfo.data
    );
    return decodedData;
  }

  const marketInfo = await getMarketInfo(marketID);
  const marketDeco = await getDecodedData(marketInfo);

  function getVaultSigner(marketId, marketDeco) {
    const seeds = [marketId.toBuffer()];
    const seedsWithNonce = seeds.concat(
      Buffer.from([Number(marketDeco.vaultSignerNonce.toString())]),
      Buffer.alloc(7)
    );
    return web3.PublicKey.createProgramAddressSync(
      seedsWithNonce,
      openbookProgram
    );
  }

  function getLPMint(marketId) {
    const seeds = [
      rayV4.toBuffer(),
      marketId.toBuffer(),
      Buffer.from("lp_mint_associated_seed", "utf-8"),
    ];
    return web3.PublicKey.findProgramAddressSync(seeds, rayV4);
  }

  function getPoolID(marketId) {
    const seeds = [
      rayV4.toBuffer(),
      marketId.toBuffer(),
      Buffer.from("amm_associated_seed", "utf-8"),
    ];
    return web3.PublicKey.findProgramAddressSync(seeds, rayV4);
  }

  function getOpenOrders(marketId) {
    const seeds = [
      rayV4.toBuffer(),
      marketId.toBuffer(),
      Buffer.from("open_order_associated_seed", "utf-8"),
    ];
    return web3.PublicKey.findProgramAddressSync(seeds, rayV4);
  }

  function getTargetOrders(marketId) {
    const seeds = [
      rayV4.toBuffer(),
      marketId.toBuffer(),
      Buffer.from("target_associated_seed", "utf-8"),
    ];
    return web3.PublicKey.findProgramAddressSync(seeds, rayV4);
  }

  function getBaseVault(marketId) {
    const seeds = [
      rayV4.toBuffer(),
      marketId.toBuffer(),
      Buffer.from("coin_vault_associated_seed", "utf-8"),
    ];
    return web3.PublicKey.findProgramAddressSync(seeds, rayV4);
  }

  function getQuoteVault(marketId) {
    const seeds = [
      rayV4.toBuffer(),
      marketId.toBuffer(),
      Buffer.from("pc_vault_associated_seed", "utf-8"),
    ];
    return web3.PublicKey.findProgramAddressSync(seeds, rayV4);
  }

  let quoteVault = getQuoteVault(marketID)[0];
  let baseVault = getBaseVault(marketID)[0];
  let targetOrders = getTargetOrders(marketID)[0];
  let openOrders = getOpenOrders(marketID)[0];
  let poolID = getPoolID(marketID)[0];
  let lpMint = getLPMint(marketID)[0];
  let vaultSigner = getVaultSigner(marketID, marketDeco);

  const baseMint = marketDeco.baseMint;
  const quoteMint = marketDeco.quoteMint;
  const mrktBaseVault = marketDeco.baseVault;
  const mrktQuoteVault = marketDeco.quoteVault;
  const mrktEventQueue = marketDeco.eventQueue;
  const mrktBids = marketDeco.bids;
  const mrktAsks = marketDeco.asks;

  let lpInfo = {
    poolID,
    baseMint,
    quoteMint,
    lpMint,
    baseDecimal,
    quoteDecimal,
    rayVersion,
    rayV4,
    Amm_Authority,
    openOrders,
    targetOrders,
    baseVault,
    quoteVault,
    withdrawQueue,
    lpVault,
    serumProgramId,
    marketID,
    vaultSigner,
    mrktBaseVault,
    mrktQuoteVault,
    mrktBids,
    mrktAsks,
    mrktEventQueue,
  };

  return lpInfo;
};

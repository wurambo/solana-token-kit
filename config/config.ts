import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import {
  TxVersion,
  Token,
  Currency,
  TOKEN_PROGRAM_ID,
  SOL,
  Percent,
} from "@raydium-io/raydium-sdk";

// REPLACEME - replace market_id
export const market_id = new PublicKey("");

export const rpc_https_url = "";

export const blockEngineUrl = "";

export const input_baseMint_tokens_percentage = 1; //ABC-Mint amount of tokens you want to add in Lp e.g. 1% = 100%. 0.9= 90%
export const delay_pool_open_time = Number(0); //dont change it because then you wont be able to perform swap in bundle.
export let quote_Mint_amount = 5; //COIN-SOL, amount of SOL u want to add to Pool amount

// remove lp:
export const LP_remove_tokens_percentage = 1; //ABC-Mint amount of tokens in Lp that you want to remove e.g. 1% = 100%. 0.9= 90%
export const LP_remove_tokens_take_profit_at_sol = 1000; //I want to remove all lp when sol reached 2 SOL

// swap info:
export const swap_sol_amount = 0.001; //Amount of SOl u want to invest
export const sell_swap_tokens_percentage = 0.5; // % of tokens u want to sell=> 1 means 100%
export const sell_swap_take_profit_ratio = 1000; // take profit e.g. 2x 3x

// pool creation fees in lamports
export const create_pool_fees = 10_000_000;
// swap sell and remove lp fees in lamports.
export const sell_remove_fees = 1_000_000;

// swap sell slippage
export const slippage = new Percent(15, 100);

// priv keys
const jito_auth_private_key = [];
const wallet_2_pay_jito_fees = [];
const LP_wallet_private_key = [];
const swap_wallet_private_key = [];
const swap1_wallet_private_key = [];
const swap2_wallet_private_key = [];

// ignore these
export const jito_auth_keypair = Keypair.fromSecretKey(
  new Uint8Array(jito_auth_private_key)
);
export const wallet_2_pay_jito_fees_keypair = Keypair.fromSecretKey(
  new Uint8Array(wallet_2_pay_jito_fees)
);
export const LP_wallet_keypair = Keypair.fromSecretKey(
  new Uint8Array(LP_wallet_private_key)
);
export const swap_wallet_keypair = Keypair.fromSecretKey(
  new Uint8Array(swap_wallet_private_key)
);
export const swap1_wallet_keypair = Keypair.fromSecretKey(
  new Uint8Array(swap1_wallet_private_key)
);
export const swap2_wallet_keypair = Keypair.fromSecretKey(
  new Uint8Array(swap2_wallet_private_key)
);

export const lookupTableCache = {};
export const connection = new Connection(rpc_https_url, "confirmed");
export const makeTxVersion = TxVersion.V0; // LEGACY
export const addLookupTableInfo = undefined; // only mainnet. other = undefined

export const DEFAULT_TOKEN = {
  SOL: SOL,
  SOL1: new Currency(9, "USDC", "USDC"),
  WSOL: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("So11111111111111111111111111111111111111112"),
    9,
    "WSOL",
    "WSOL"
  ),
  USDC: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    6,
    "USDC",
    "USDC"
  ),
};

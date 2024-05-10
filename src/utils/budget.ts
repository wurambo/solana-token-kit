import axios from "axios";
import { ComputeBudgetConfig } from "@raydium-io/raydium-sdk";
import { sell_remove_fees } from "../../config/config";

interface SolanaFeeInfo {
  min: number;
  max: number;
  avg: number;
  priorityTx: number;
  nonVotes: number;
  priorityRatio: number;
  avgCuPerBlock: number;
  blockspaceUsageRatio: number;
}
type SolanaFeeInfoJson = {
  "1": SolanaFeeInfo;
  "5": SolanaFeeInfo;
  "15": SolanaFeeInfo;
};

export async function getComputeBudgetConfig(): Promise<
  ComputeBudgetConfig | undefined
> {
  let avg;
  try {
    const response = await axios.get<SolanaFeeInfoJson>(
      "https://solanacompass.com/api/fees"
    );
    const json = response.data;
    avg = json?.[15]?.avg;
  } catch (error) {}

  return {
    units: 600000,
    microLamports: Math.min(
      Math.ceil(((avg ?? 50000) * 1000000) / 600000),
      25000
    ),
  } as ComputeBudgetConfig;
}

export async function getComputeBudgetConfigHigh(): Promise<
  ComputeBudgetConfig | undefined
> {
  let avg;
  try {
    const response = await axios.get<SolanaFeeInfoJson>(
      "https://solanacompass.com/api/fees"
    );
    const json = response.data;
    avg = json?.[15]?.avg;
  } catch (error) {}

  return {
    units: sell_remove_fees,
    microLamports: Math.min(
      Math.ceil(((avg ?? 100000) * 1000000) / 600000),
      25000
    ),
  } as ComputeBudgetConfig;
}

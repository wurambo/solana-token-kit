export const percentAmount = (amount: string, percent: number): string => {
  const inputNum = BigInt(amount); // Convert string to BigInt
  const result = inputNum * BigInt(percent * 100); // Multiply by percent
  return (result / BigInt(100)).toString(); // Round down to the nearest integer
};

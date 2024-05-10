// CHANGE HERE
export let tokenInfo = {
  amount: 100000000,
  decimals: 9,
  metadata: "",
  symbol: "",
  tokenName: "",
};

export let metaDataforToken = {
  name: tokenInfo.tokenName,
  symbol: tokenInfo.symbol,
  image: "",
  description: `
                            `,
  extensions: {
    website: "",
    twitter: "",
    telegram: "",
  },
  tags: ["SOLANA"],
  creator: {
    name: "",
    site: "",
  },
};
// END CHANGES

export const FILE_NAME = "image.png";

export const revokeMintBool = true;
export const revokeFreezeBool = true;

export const NFT_STORAGE_TOKEN = "";

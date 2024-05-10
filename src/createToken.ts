import { createToken } from "./utils/createToken";
import { NFTStorage, Blob, File } from "nft.storage";
import { writeFile, promises } from "node:fs";
import {
  FILE_NAME,
  NFT_STORAGE_TOKEN,
  revokeMintBool,
  revokeFreezeBool,
  tokenInfo,
  metaDataforToken,
} from "../config/config-token";
import { delay } from "./utils/helpers";

async function main() {
  // uploadMetaData
  const metadata_url = await uploadMetaData();
  if (!metadata_url) {
    console.log("Metadata failed");
    return;
  }
  tokenInfo.metadata = metadata_url;

  const mintAddress = await createToken(
    tokenInfo,
    revokeMintBool,
    revokeFreezeBool
  );
  console.log(`Mint Link: https://solscan.io/token/${mintAddress.toString()}`);
  writeFile(
    "config/config-created-token-address.json",
    JSON.stringify({ mintAddress }),
    () => {}
  );
  console.log("Token finished creating.");
  // wait 1 second before exiting to ensure file gets written
  delay(1000);
}

async function uploadMetaData() {
  const endpoint = "https://api.nft.storage";
  const storage = new NFTStorage({
    endpoint: new URL(endpoint),
    token: NFT_STORAGE_TOKEN,
  });

  // Store image
  const data = await promises.readFile(`./config/${FILE_NAME}`);
  const cid1 = await storage.storeBlob(new Blob([data]));
  const imageUrl = `https://${cid1}.ipfs.nftstorage.link`;
  const status1 = await storage.status(cid1);
  if (status1.pin.status != "pinned") {
    console.log("Could not upload image, Status: ", status1.pin.status);
    return;
  }

  metaDataforToken.image = imageUrl;

  // store as a json file
  const jsonString = JSON.stringify(metaDataforToken, null, "\t");
  const file = new File([jsonString], "metadata.json", {
    type: "application/json",
  });

  const cid = await storage.storeBlob(file);

  if (status1.pin.status != "pinned") {
    console.log("Could not upload Metadata, Status: ", status1.pin.status);
    return;
  }

  return `https://${cid}.ipfs.nftstorage.link`;
}

main();

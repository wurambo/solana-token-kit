import { sha256 } from "@noble/hashes/sha256";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";

const createWithSeed = (
  fromPublicKey: PublicKey,
  seed: string,
  programId: PublicKey
) => {
  const buffer = Buffer.concat([
    fromPublicKey.toBuffer(),
    Buffer.from(seed),
    programId.toBuffer(),
  ]);
  const publicKeyBytes = sha256(buffer);
  return new PublicKey(publicKeyBytes);
};

export const generatePubKey = ({
  fromPublicKey,
  programId = TOKEN_PROGRAM_ID,
}: {
  fromPublicKey: PublicKey;
  programId: PublicKey;
}) => {
  const seed = Keypair.generate().publicKey.toBase58().slice(0, 32);
  const publicKey = createWithSeed(fromPublicKey, seed, programId);
  return { publicKey, seed };
};

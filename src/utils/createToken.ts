import {
  Keypair,
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  Transaction,
} from "@solana/web3.js";
import {
  AuthorityType,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { connection, LP_wallet_keypair } from "../../config/config";
import { sendBundle } from "./jitoBundle/sendBundle";

export const createToken = async (
  tokenInfo,
  revokeMintBool,
  revokeFreezeBool
) => {
  while (true) {
    try {
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      const mintKeypair = Keypair.generate();
      const myPublicKey = LP_wallet_keypair.publicKey;

      const tokenATA = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        myPublicKey
      );
      const createMetadataInstruction =
        createCreateMetadataAccountV3Instruction(
          {
            metadata: PublicKey.findProgramAddressSync(
              [
                Buffer.from("metadata"),
                PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            mint: mintKeypair.publicKey,
            mintAuthority: myPublicKey,
            payer: myPublicKey,
            updateAuthority: myPublicKey,
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name: tokenInfo.tokenName,
                symbol: tokenInfo.symbol,
                uri: tokenInfo.metadata,
                creators: null,
                sellerFeeBasisPoints: 0,
                uses: null,
                collection: null,
              },
              isMutable: true,
              collectionDetails: null,
            },
          }
        );

      const createNewTokenTransaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: myPublicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          tokenInfo.decimals,
          myPublicKey,
          myPublicKey,
          TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          myPublicKey,
          tokenATA,
          myPublicKey,
          mintKeypair.publicKey
        ),
        createMintToInstruction(
          mintKeypair.publicKey,
          tokenATA,
          myPublicKey,
          tokenInfo.amount * Math.pow(10, tokenInfo.decimals)
        ),
        createMetadataInstruction
      );

      if (revokeMintBool) {
        let revokeMint = createSetAuthorityInstruction(
          mintKeypair.publicKey, // mint account || token account
          myPublicKey, // current auth
          AuthorityType.MintTokens, // authority type
          null
        );
        createNewTokenTransaction.add(revokeMint);
      }

      if (revokeFreezeBool) {
        let revokeFreeze = createSetAuthorityInstruction(
          mintKeypair.publicKey, // mint account || token account
          myPublicKey, // current auth
          AuthorityType.FreezeAccount, // authority type
          null
        );

        createNewTokenTransaction.add(revokeFreeze);
      }

      let blockhash = (await connection.getLatestBlockhash("finalized"))
        .blockhash;
      createNewTokenTransaction.feePayer = LP_wallet_keypair.publicKey;
      createNewTokenTransaction.recentBlockhash = blockhash;
      createNewTokenTransaction.sign(LP_wallet_keypair, mintKeypair);

      const success = await sendBundle([createNewTokenTransaction]);

      if (success) {
        console.log("Token Created : ", tokenInfo);
        console.log("Token Mint Address :", mintKeypair.publicKey.toString());
        return mintKeypair.publicKey;
      }
    } catch (error) {
      console.log("Error creating token: ", error);
    }
  }
};

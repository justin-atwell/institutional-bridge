import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorageBridge } from "../target/types/anchorage_bridge";
import { expect } from "chai";

describe("anchorage-bridge", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.AnchorageBridge as Program<AnchorageBridge>;

  it("Initializes the Qualified Custody Vault", async () => {
    // Derive the PDA address manually so we can check it
    const [vaultPda, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeVault()
      .accountsStrict({
        vaultAccount: vaultPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId, // Note: You must include this too!
      })
      .rpc();

    // Fetch the account data from the blockchain
    const account = await program.account.vaultState.fetch(vaultPda);

    console.log("Vault Owner:", account.owner.toBase58());
    expect(account.owner.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
    expect(account.collateralAmount.toNumber()).to.equal(0);
  });
});
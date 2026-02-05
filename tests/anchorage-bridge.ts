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

  it("Toggles the Emergency Freeze", async () => {
  const [globalStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global-state")],
    program.programId
  );

  // 1. Turn the freeze ON
  await program.methods
    .toggleFreeze(true)
    .accountsStrict({
      globalState: globalStatePda,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  let state = await program.account.globalState.fetch(globalStatePda);
  expect(state.isFrozen).to.be.true;
  console.log("❄️ Bridge is now FROZEN");

  // 2. Turn the freeze OFF
  await program.methods
    .toggleFreeze(false)
    .accountsStrict({
      globalState: globalStatePda,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  state = await program.account.globalState.fetch(globalStatePda);
  expect(state.isFrozen).to.be.false;
  console.log("✅ Bridge is now ACTIVE");
});
});
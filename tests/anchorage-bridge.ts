import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorageBridge } from "../target/types/anchorage_bridge";
import { expect } from "chai";
import { 
  TOKEN_2022_PROGRAM_ID, 
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

describe("anchorage-bridge: Day in the Life", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.AnchorageBridge as Program<AnchorageBridge>;

  // PDAs
  const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  const [globalStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("global-state")],
    program.programId
  );

  it("Executes full institutional lifecycle", async () => {
    console.log("Starting simulation...");

    // 1. SETUP: Initialize Vault & Bridge State
    await program.methods.initializeVault().accountsStrict({
      vaultAccount: vaultPda,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();

    await program.methods.toggleFreeze(false).accountsStrict({
      globalState: globalStatePda,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();

    // 2. OPERATION: CFO Rebalances $5,000 USDPT
    const rebalanceAmount = new anchor.BN(5000);
    await program.methods.atomicRebalance(rebalanceAmount).accountsStrict({
      vaultAccount: vaultPda,
      globalState: globalStatePda,
      authority: provider.wallet.publicKey,
    }).rpc();

    let vaultData = await program.account.vaultState.fetch(vaultPda);
    expect(vaultData.collateralAmount.toNumber()).to.equal(5000);
    console.log("settlement Successful: Vault holds $5,000");

    // 3. INCIDENT: Bank triggers Emergency Freeze
    await program.methods.toggleFreeze(true).accountsStrict({
      globalState: globalStatePda,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();
    console.log("ALERT: Emergency Freeze Engaged");

    // 4. VERIFICATION: CFO attempts another $1,000 rebalance (Should fail)
    try {
      await program.methods.atomicRebalance(new anchor.BN(1000)).accountsStrict({
        vaultAccount: vaultPda,
        globalState: globalStatePda,
        authority: provider.wallet.publicKey,
      }).rpc();
      expect.fail("Rebalance should have failed during freeze!");
    } catch (err: any) {
      // Look for our custom Rust error code
      expect(err.error.errorCode.code).to.equal("BridgeIsFrozen");
      console.log("blocked rebalance during freeze.");
    }

    // 5. RECOVERY: Lift Freeze & Resume
    await program.methods.toggleFreeze(false).accountsStrict({
      globalState: globalStatePda,
      authority: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc();
    console.log("Bridge back online.");
  });
});
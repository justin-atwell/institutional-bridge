"use client"; // Required for interactivity on Mac/Next.js

import React, { useState } from 'react';
// These are the "Beautiful" icons we'll use
import { ShieldAlert, BarChart3, Terminal as ConsoleIcon, Zap, Lock, Unlock } from 'lucide-react';
import * as anchor from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// Note: We'll need to point this to the IDL file Anchor built for us
import idl from "../../../target/idl/anchorage_bridge.json";


export default function BridgeDashboard() {
  // 1. STATE: This is our "Easy Demo" switch logic
  const [isTechnical, setIsTechnical] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false); // Local state for the demo
  const [mounted, setMounted] = useState(false);
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [logs, setLogs] = useState<string[]>([
    "Checking Program ID: 2vganB6...",
    "System initialized. Ready for SVM instructions."
  ]);

  // 1. Trigger the mount state so the button appears
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Automatically fetch data when the wallet is connected
  React.useEffect(() => {
    if (wallet) {
      fetchVaultData();
    }
  }, [wallet]);


  const [vaultBalance, setVaultBalance] = useState<number>(0);

  const fetchVaultData = async () => {
    if (!wallet) return;

    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program(idl as any, provider);

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), wallet.publicKey.toBuffer()],
      program.programId
    );

    try {
      const account = await (program.account as any)["vaultState"].fetch(vaultPda);

      // Make sure the field name matches your Rust struct exactly (usually camelCase in JS)
      const amount = account.collateralAmount || account.amount || 0;

      // If it's an Anchor BN (BigNumber), we use .toNumber()
      setVaultBalance(account.collateralAmount.toNumber());

    } catch (e) {
      console.error("Fetch failed", e);
    }
  };

  const handleInitialize = async () => {
    if (!wallet) return alert("Connect wallet first!");

    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program(idl as any, provider);

    const [globalStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-state")],
      program.programId
    );

    try {
      addLog("🛠️ Initializing Global State...");
      // Calling toggleFreeze with 'false' triggers the 'init' logic in your Rust code
      await program.methods
        .toggleFreeze(false)
        .accounts({
          globalState: globalStatePda,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      addLog("Global State Initialized!");
      alert("System Initialized on Localhost!");
    } catch (err) {
      console.error("Initialization failed:", err);
      // If it says 'already in use', that's actually fine!
    }
  };
  const handleToggleFreeze = async () => {
    if (!wallet) return alert("Please connect your wallet first!");

    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program(idl as any, provider);

    // Derive the Global State PDA
    const [globalStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-state")],
      program.programId
    );

    try {
      // Call the toggle_freeze function from your Rust code
      await program.methods
        .toggleFreeze(!isFrozen) // Sends the opposite of current state
        .accounts({
          globalState: globalStatePda,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      setIsFrozen(!isFrozen); // Update UI state on success
    } catch (err) {
      console.error("Freeze failed:", err);
      alert("Transaction failed. Check the console for details.");
    }
  };

  const handleAtomicRebalance = async () => {
    if (!wallet) return;
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program(idl as any, provider);

    addLog("Instruction: atomicRebalance(5000)");
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const [globalStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-state")],
      program.programId
    );

    try {
      addLog("Instruction: atomicRebalance(5000)");
      await program.methods
        .atomicRebalance(new anchor.BN(5000))
        .accounts({
          vaultAccount: vaultPda,
          globalState: globalStatePda,
          authority: wallet.publicKey,
        })
        .rpc();
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Vault Balanced at $5,000!");
      await fetchVaultData();
    } catch (err) {
      console.error("Rebalance failed:", err);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] > ${message}`, ...prev].slice(0, 50));
  };

  const handleInitVault = async () => {
    if (!wallet) return alert("Connect wallet!");

    addLog("Instruction: Initializing Vault");
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program(idl as any, provider);

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), wallet.publicKey.toBuffer()],
      program.programId
    );


    try {
      await program.methods
        .initializeVault() // Ensure this matches your Rust lib.rs exactly
        .accounts({
          vaultAccount: vaultPda,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      alert("🏦 Vault Initialized!");
      fetchVaultData();
    } catch (err: any) {
      const logs = err.logs || (err.msg ? [err.msg] : []);

      // Check if the error is the "already in use" (0x0) error
      if (logs.some((log: string) => log.includes("already in use"))) {
        addLog("Vault already exists. Proceeding to Rebalance...");
      } else {
        addLog(`Init failed: ${err.message || "Unknown error"}`);
        console.error("Initialization failed:", err);
      }
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${isTechnical ? 'bg-slate-950 text-emerald-400 font-mono' : 'bg-slate-50 text-slate-900'}`}>

      {/* NAVIGATION BAR */}
      <nav className={`p-4 border-b flex justify-between items-center backdrop-blur-md sticky top-0 z-50 ${isTechnical ? 'border-emerald-900 bg-slate-950/80' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight italic">Institutional Bridge</h1>
        </div>

        {/* THE EASY DEMO TOGGLE */}
        <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-xl border border-slate-300">
          <button
            onClick={() => setIsTechnical(false)}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${!isTechnical ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            CFO VIEW
          </button>
          <button
            onClick={() => setIsTechnical(true)}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isTechnical ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
          >
            TECH LOGS
          </button>
          <div className="wallet-adapter-button-trigger">
            {mounted ? (
              <WalletMultiButton />
            ) : (
              <div className="text-slate-400 text-xs animate-pulse">Initializing Wallet...</div>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto p-8">
        {isTechnical ? (
          /* --- TECHNICAL VIEW (SVM LOGS) --- */
          <div className="space-y-6">
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-emerald-500">
                <ConsoleIcon size={16} /> LIVE SVM EXECUTION LOGS
              </h2>
              <div className="bg-black/50 p-4 rounded-lg h-64 font-mono text-[10px] overflow-y-auto border border-emerald-900/50">
                <div className="bg-black/50 p-4 rounded-lg h-64 font-mono text-[10px] overflow-y-auto border border-emerald-900/50">
                  {logs.map((log, i) => (
                    <p key={i} className={log.includes("ERROR") ? "text-red-400" : "text-emerald-400"}>
                      {log}
                    </p>
                  ))}
                  <p className="text-emerald-600 animate-pulse">_ Streaming transactions...</p>
                </div>
              </div>
            </div>
            {/* --- ADMIN ACTIONS (Place this inside the Technical View block) --- */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleInitialize}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-black transition-all transform active:scale-95"
              >
                Step 1. INIT GLOBAL STATE
              </button>

              <button
                onClick={handleInitVault} // Changed from handleInitialize
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black transition-all transform active:scale-95 shadow-lg shadow-blue-500/20"
              >
                Step 2. INIT USER VAULT
              </button>
            </div>

            <button
              onClick={handleAtomicRebalance}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-lg font-black text-xs"
            >
              Step 3. DEPOSIT $5,000 (DEMO)
            </button>

          </div>

        ) : (
          /* --- CFO VIEW (INSTITUTIONAL METRICS) --- */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* VAULT STATUS */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl hover:shadow-2xl transition-shadow">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Qualified Custody Vault</h3>
              <p className="text-5xl font-black text-slate-900 mb-6">${vaultBalance.toLocaleString()}<span className="text-lg font-normal text-slate-400"> USDPT</span></p>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-3/4"></div>
              </div>
            </div>

            {/* KILLSWITCH ACTION */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Bridge Compliance Status</h3>
                <div className={`flex items-center gap-2 text-lg font-bold mb-4 ${isFrozen ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isFrozen ? <Lock size={20} /> : <Unlock size={20} />}
                  {isFrozen ? 'BRIDGE FROZEN' : 'BRIDGE OPERATIONAL'}
                </div>
              </div>
              <button
                onClick={() => handleToggleFreeze()}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 ${isFrozen ? 'bg-emerald-500 shadow-emerald-200 shadow-lg' : 'bg-red-600 shadow-red-200 shadow-lg'}`}
              >
                {isFrozen ? 'LIFT EMERGENCY FREEZE' : 'INITIATE EMERGENCY FREEZE'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
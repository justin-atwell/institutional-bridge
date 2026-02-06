### Banking Bridge: Institutional SVM Custody
An institutional-grade cross-chain bridge dashboard and SVM program designed for high-compliance asset management. This project demonstrates Atomic Rebalancing, PDA-based Custody, and a Global Emergency Killswitch (Freeze) mechanism.

### Key Features
Atomic Rebalancing: SVM instructions that ensure consistency between off-chain collateral and on-chain vault state.

Dual-View Interface:

High-level institutional metrics and compliance status.

Real-time SVM execution streaming for auditability.

Global "Emergency Freeze" capability to pause bridge operations instantly via PDA state management.

User vaults derived using Program Derived Addresses (PDAs) for secure, non-custodial asset tracking.

### Tech Stack
Blockchain: Solana (SVM)

Framework: Anchor 0.30 (Rust)

Frontend: Next.js 15 (App Router), Tailwind CSS

Wallet: Solana Wallet Adapter (Phantom)

Icons: Lucide React

### Quick Start (Local Development)
1. Prerequisites
Ensure your local environment is configured for Solana development:

Bash
```
solana --version
anchor --version
node --version
```
2. Setup Validator
Start a clean local ledger to wipe previous state:

Bash
```
solana-test-validator -r
```
3. Deploy Program
Bash
```
anchor build
anchor deploy
```
4. Configure Frontend
Update the Program ID in src/app/page.tsx with the ID generated during deployment.

Bash
```
npm install
npm run dev
```

Demo Flow (The "Nuclear Reset" Sequence)
1. Airdrop SOL: Fund your dev wallet via solana airdrop 2.

2. Initialize Global State: Use the Admin panel in Tech Logs to allocate the master killswitch account.

3. Provision Vault: Initialize your unique user custody vault PDA.

4. Execute Rebalance: Trigger an atomic rebalance to simulate an inbound transfer (e.g., $5,000 USDPT).

5. Verify Compliance: Toggle the Emergency Freeze to witness real-time UI/UX state changes.

Author
Justin Atwell Senior Developer Advocate | Software Engineer

Specializing in Web3 infrastructure (Solana, Hedera) and high-stakes behavioral decision-making systems.
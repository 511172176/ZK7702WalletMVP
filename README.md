# ZK7702WalletMVP

Minimal wallet prototype using ZK + EIP-7702.

## Setup
1. `npm install hardhat ethers snarkjs circomlibjs`
2. `npx hardhat init`
3. `npx hardhat compile`
4. `npx hardhat node`

## Workflow
1. `npx hardhat run scripts/deployValidator.js --network sepolia`
2. `node scripts/generateProof.js <leaf>`
3. Open `frontend/index.html` in browser
4. Enter leaf value, click Submit to send EIP-7702 tx
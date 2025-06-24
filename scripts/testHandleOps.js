// scripts/testHandleOps.js
const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer   = provider.getSigner(0);

  // —— 1. 地址 ——  
  const entryPointAddr = "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108";
  const simpleAccount  = "0x1c85638e118b37167e9298c2268758e058DdfDA0";
  const validatorAddr  = "0xC9a43158891282A2B1475592D5719c001986Aaec";
  const recipient      = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // —— 2. 读取 EntryPoint 合约（包含 getNonce 和 handleOps）——  
  const entryPoint = new ethers.Contract(
    entryPointAddr,
    [
      "function getNonce(address sender, uint192 key) view returns (uint256)",
      "function handleOps(tuple(address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxPriorityFeePerGas,uint256 maxFeePerGas,bytes paymasterAndData,bytes signature)[] ops, address payable beneficiary)"
    ],
    signer
  );

  // —— 3. Nonce & fees ——  
  const nonce = await entryPoint.getNonce(simpleAccount, 0);
  const feeData = await provider.getFeeData();

  // —— 4. callData ——  
  const iface = new ethers.utils.Interface([
    "function execute(address,uint256,bytes)"
  ]);
  const callData = iface.encodeFunctionData("execute", [
    recipient,
    ethers.utils.parseEther("0.001"),
    "0x"
  ]);

  // —— 5. ZK signature ——  
  const proof = require("../proof.json");
  const a   = [proof.pi_a[0], proof.pi_a[1]];
  const b   = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c   = [proof.pi_c[0], proof.pi_c[1]];
  const pub = [1];
  const signature = ethers.utils.defaultAbiCoder.encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[1]"],
    [a, b, c, pub]
  );

  // —— 6. 组装 UserOp ——  
  const userOp = {
    sender:               simpleAccount,
    nonce:                nonce,
    initCode:             "0x",
    callData,
    callGasLimit:         0x186a0,
    verificationGasLimit: 0x30d40,
    preVerificationGas:   0xc350,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.toHexString(),
    maxFeePerGas:         feeData.maxFeePerGas.toHexString(),
    paymasterAndData:     "0x",
    signature
  };

  // —— 7. 静态调用 handleOps ——  
  try {
    await entryPoint.callStatic.handleOps([userOp], signer.getAddress());
    console.log("✅ handleOps simulation passed (no revert)");
  } catch (err) {
    console.error("❌ handleOps simulation reverted:", err.message);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

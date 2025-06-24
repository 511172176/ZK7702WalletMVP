// scripts/sendViaEntryPoint.js

// 📦 載入套件
const { ethers } = require("hardhat");
const axios = require("axios");

// 📄 載入 snarkjs 輸出的 proof.json
const proof = require("../proof.json");

async function main() {
  // —— 0. 基本設定 ——  
  const RPC_URL     = "http://127.0.0.1:8545";
  const ENTRYPOINT  = "0x4337084D9E255Ff0702461CF8895CE9E3b5FfF108"; // EntryPoint 合約地址
  const VALIDATOR   = "0xC9a43158891282A2B1475592D5719c001986Aaec"; // ZKValidator
  const SIMPLE_ACC  = "0x1c85638e118b37167e9298c2268758e058DdfDA0"; // SimpleAccount
  const RECIPIENT   = "0xf39Fd6e51aad88f6F4ce6aB8827279cffFb92266"; // 執行目標

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const [signer] = await provider.listAccounts().then(addrs => addrs.map(a=>provider.getSigner(a))).catch(()=>[]);
  // 如果上面取不到 signer，改成：
  // const [signer] = await ethers.getSigners();

  // —— 1. 為 SimpleAccount 注資 ——  
  console.log("💳 為 SimpleAccount 注資 0.01 ETH...");
  await signer.sendTransaction({
    to: SIMPLE_ACC,
    value: ethers.utils.parseEther("0.01")
  });

  // —— 2. 取得 nonce ——  
  const ep = new ethers.Contract(
    ENTRYPOINT,
    ["function getNonce(address,uint192) view returns(uint256)"],
    provider
  );
  const nonce = await ep.getNonce(SIMPLE_ACC, 0);

  // —— 3. encode callData (SimpleAccount.execute) ——  
  const simpleIface = new ethers.utils.Interface([
    "function execute(address to,uint256 value,bytes data)"
  ]);
  const callData = simpleIface.encodeFunctionData("execute", [
    RECIPIENT,
    ethers.utils.parseEther("0.001"),
    "0x"
  ]);

  // —— 4. ZK proof 編碼 signature ——  
  // 注意：pi_b 的 G2 元素要做 (b[0][1],b[0][0]) 反轉
  const a   = [proof.pi_a[0], proof.pi_a[1]];
  const b   = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c   = [proof.pi_c[0], proof.pi_c[1]];
  const pub = [1];  // 你的 public signal（同 public.json）

  const zkSig = ethers.utils.defaultAbiCoder.encode(
    ["uint256[2]","uint256[2][2]","uint256[2]","uint256[1]"],
    [a, b, c, pub]
  );
  console.log("📦 Encoded ZK signature:", zkSig);

  // —— 5. 組成 UserOperation 結構 ——  
  const feeData = await provider.getFeeData();
  const userOp = {
    sender:               SIMPLE_ACC,
    nonce:                nonce.toHexString(),
    initCode:             "0x",
    callData,
    callGasLimit:         "0x186a0",               // 100 000
    verificationGasLimit: "0x30d40",               // 200 000
    preVerificationGas:   "0x0c350",               // 50 000
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.toHexString(),
    maxFeePerGas:         feeData.maxFeePerGas.toHexString(),
    paymasterAndData:     "0x",
    signature:            zkSig
  };

  // —— 6. 靜態呼叫 validateUserOp 確認不 revert ——  
  const validator = new ethers.Contract(
    VALIDATOR,
    ["function validateUserOp((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes32,uint256) returns(uint256)"],
    signer
  );

  // 計算 userOpHash（EntryPoint 內部也這麼做）
  const userOpHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address","uint256","bytes","uint256","uint256","uint256","uint256","uint256","bytes","bytes"],
      [
        userOp.sender,
        userOp.nonce,
        userOp.callData,
        userOp.callGasLimit,
        userOp.verificationGasLimit,
        userOp.preVerificationGas,
        userOp.maxPriorityFeePerGas,
        userOp.maxFeePerGas,
        userOp.paymasterAndData,
        userOp.initCode
      ]
    )
  );

  try {
    await validator.callStatic.validateUserOp(userOp, userOpHash, 0);
    console.log("✅ 本地 CallStatic 驗證通過");
  } catch(e) {
    console.error("❌ 本地 CallStatic 驗證失敗：", e.message);
    process.exit(1);
  }

  // —— 7. 呼叫 EntryPoint.handleOps ——  
  // 這裡用 ethers 直接送交易，也可改成 axios rpc 呼叫 eth_sendUserOperation
  const entryPoint = await ethers.getContractAt(
    "IEntryPoint",
    ENTRYPOINT,
    signer
  );

  console.log("🚀 呼叫 EntryPoint.handleOps...");
  const tx = await entryPoint.handleOps(
    [userOp],
    signer.address,          // beneficiary: bundler 收費地址
    { gasLimit: 5_000_000 }  // 視情況調整
  );
  const receipt = await tx.wait();
  console.log("🎉 handleOps 完成，txHash =", receipt.transactionHash);
}

main().catch(err => {
  console.error("❌ 腳本執行錯誤：", err);
  process.exit(1);
});

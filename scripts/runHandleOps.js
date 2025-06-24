// scripts/runHandleOps.js
const { ethers } = require("hardhat");
const proof = require("../proof.json");

async function main() {
  const [deployer, beneficiary] = await ethers.getSigners();

  // 1️⃣ EntryPoint 合约
  const ENTRY_POINT = "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108";
  const entryPoint = new ethers.Contract(
    ENTRY_POINT,
    [
      "function depositTo(address) payable external",
      "function getNonce(address,uint192) view returns (uint256)",
      "function handleOps(tuple(" +
        "address sender,uint256 nonce,bytes initCode,bytes callData," +
        "uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas," +
        "uint256 maxPriorityFeePerGas,uint256 maxFeePerGas,bytes paymasterAndData,bytes signature" +
      ")[] ops, address beneficiary) payable external"
    ],
    deployer
  );

  // 2️⃣ 你的 SimpleAccount 地址
  const SIMPLE_ACCOUNT = "0x1c85638e118b37167e9298c2268758e058DdfDA0";

  // 3️⃣ 存款（多存一点以防万一）
  console.log(`💳 存 0.1 ETH 给 EntryPoint.depositTo(${SIMPLE_ACCOUNT})`);
  await (await entryPoint.depositTo(SIMPLE_ACCOUNT, {
    value: ethers.utils.parseEther("0.1")
  })).wait();

  // 4️⃣ 组 callData：执行转给 beneficiary 0.001 ETH
  const execIface = new ethers.utils.Interface([
    "function execute(address,uint256,bytes)"
  ]);
  const callData = execIface.encodeFunctionData("execute", [
    beneficiary.address,
    ethers.utils.parseEther("0.001"),
    "0x"
  ]);

  // 5️⃣ Nonce
  const nonce = await entryPoint.getNonce(SIMPLE_ACCOUNT, 0);

  // 6️⃣ ZK proof 签名
  const a   = [proof.pi_a[0], proof.pi_a[1]];
  const b   = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c   = [proof.pi_c[0], proof.pi_c[1]];
  const pub = [1];  // public signal
  const signature = ethers.utils.defaultAbiCoder.encode(
    ["uint256[2]","uint256[2][2]","uint256[2]","uint256[1]"],
    [a, b, c, pub]
  );

  // 7️⃣ 组 UserOp，gas 都开大
  const userOp = {
    sender:               SIMPLE_ACCOUNT,
    nonce:                nonce.toHexString(),
    initCode:             "0x",
    callData,
    callGasLimit:         ethers.utils.hexlify(800_000),
    verificationGasLimit: ethers.utils.hexlify(1_200_000),
    preVerificationGas:   ethers.utils.hexlify(200_000),
    maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
    maxFeePerGas:         ethers.utils.parseUnits("10", "gwei"),
    paymasterAndData:     "0x",
    signature,
  };

  // 8️⃣ 先模拟一遍
  try {
    await entryPoint.callStatic.handleOps([userOp], beneficiary.address, {
      gasLimit: 5_000_000,
      value:    0
    });
    console.log("✅ callStatic.handleOps 模拟通过");
  } catch (e) {
    console.error("❌ callStatic.handleOps 模拟失败：", e);
    process.exit(1);
  }

  // 9️⃣ 真正发 handleOps
  console.log("🚀 发送 handleOps …");
  const tx = await entryPoint.handleOps(
    [userOp],
    beneficiary.address,
    {
      gasLimit: 5_000_000,
      value:    0
    }
  );
  console.log("⛓ txHash =", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ handleOps 完成，区块高度", receipt.blockNumber);
}

main().catch(err => {
  console.error("❌ 错误：", err);
  process.exit(1);

});

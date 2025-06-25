// scripts/sendZKExec.js
const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();

  // 自動載入部署地址
  const { zkAccount: ZK_ACCOUNT_ADDR, echo: ECHO_ADDR } = JSON.parse(fs.readFileSync("deployed.json"));

  // 載入 ABI
  const artifactPath = "./artifacts/contracts/ZK7702Account.sol/ZK7702Account.json";
  const abiJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const ZK_ACCOUNT_ABI = abiJson.abi;

  const echoIface = new ethers.utils.Interface([
    "function ping() external pure returns (string)"
  ]);

  const proof = JSON.parse(fs.readFileSync("proof.json", "utf8"));
  const a = [proof.pi_a[0], proof.pi_a[1]];
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c = [proof.pi_c[0], proof.pi_c[1]];
  const pubSignals = [1]; // 根據你的電路

  const zkSignature = ethers.utils.defaultAbiCoder.encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[1]"],
    [a, b, c, pubSignals]
  );

  const zkAccount = new ethers.Contract(ZK_ACCOUNT_ADDR, ZK_ACCOUNT_ABI, signer);
  console.log("✅ 合約初始化成功:", zkAccount.address);

  const data = echoIface.encodeFunctionData("ping", []);
  const tx = await zkAccount.execute(zkSignature, ECHO_ADDR, 0, data);
  console.log("⏳ 發送交易中... TX Hash:", tx.hash);
  await tx.wait();
  console.log("✅ 交易成功！");
}

main().catch((err) => {
  console.error("❌ 錯誤:", err);
  process.exit(1);
});

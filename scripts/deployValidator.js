const fs = require("fs");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Groth16Verifier 部署地址：", verifier.address);

  const ZKValidator = await hre.ethers.getContractFactory("ZKValidator");
  const validator = await ZKValidator.deploy(verifier.address);
  await validator.deployed();
  console.log("ZKValidator 部署地址：", validator.address);

  const ZK7702Account = await hre.ethers.getContractFactory("ZK7702Account");
  const zk7702Account = await ZK7702Account.deploy(verifier.address); // ✅ 僅傳 verifier
  await zk7702Account.deployed();
  console.log("ZK7702Account 部署地址：", zk7702Account.address);

  const Echo = await hre.ethers.getContractFactory("Echo");
  const echo = await Echo.deploy();
  await echo.deployed();
  console.log("Echo 地址:", echo.address);

  const deployedInfo = {
    verifier: verifier.address,
    validator: validator.address,
    zkAccount: zk7702Account.address, // ✅ 修正這行
    echo: echo.address,
    deployer: deployer.address
  };
  fs.writeFileSync("deployed.json", JSON.stringify(deployedInfo, null, 2));
  console.log("📦 已儲存部署資訊至 deployed.json");
}

main().catch((error) => {
  console.error("❌ 部署失敗:", error);
  process.exitCode = 1;
});

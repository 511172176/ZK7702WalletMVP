const hre = require("hardhat");

async function main() {
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Groth16Verifier 部署地址：", verifier.address);

  const ZKValidator = await hre.ethers.getContractFactory("ZKValidator");
  const validator = await ZKValidator.deploy(verifier.address);
  await validator.deployed();
  console.log("ZKValidator 部署地址：", validator.address);

  const entryPoint = "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108"; // 可替換成實際 EntryPoint
  const SimpleAccount = await hre.ethers.getContractFactory("SimpleAccount");
  const account = await SimpleAccount.deploy(entryPoint, validator.address);
  await account.deployed();
  console.log("SimpleAccount 部署地址：", account.address);

  const Echo = await hre.ethers.getContractFactory("Echo");
  const echo = await Echo.deploy();
  await echo.deployed();
  console.log("Echo 地址:", echo.address);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

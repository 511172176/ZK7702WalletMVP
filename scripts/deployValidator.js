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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

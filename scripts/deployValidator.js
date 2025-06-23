const hre = require("hardhat");

async function main() {
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();  // ← ethers v5 用法
  console.log("Verifier deployed:", verifier.address);

  const Validator = await hre.ethers.getContractFactory("ZKValidator");
  const validator = await Validator.deploy(verifier.address);
  await validator.deployed();  // ← 這裡也要改
  console.log("Validator deployed:", validator.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const hre = require("hardhat");

async function main() {
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  console.log("Verifier deployed:", verifier.target);

  const Validator = await hre.ethers.getContractFactory("ZKValidator");
  const validator = await Validator.deploy(verifier.target);
  await validator.waitForDeployment();
  console.log("Validator deployed:", validator.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
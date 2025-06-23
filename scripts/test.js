const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
  const proof = JSON.parse(fs.readFileSync("proof.json"));
  const publicSignals = JSON.parse(fs.readFileSync("public.json"));

  const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Groth16Verifier.deploy();
  await verifier.deployed();
  console.log("Groth16Verifier 部署地址：", verifier.address);

  const ZKValidator = await ethers.getContractFactory("ZKValidator");
  const zkValidator = await ZKValidator.deploy(verifier.address);
  await zkValidator.deployed();
  console.log("ZKValidator 部署地址：", zkValidator.address);

  const a = [proof.pi_a[0], proof.pi_a[1]];
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c = [proof.pi_c[0], proof.pi_c[1]];

  try {
    const tx = await zkValidator.verifyAndSend(a, b, c, publicSignals, {
      value: ethers.utils.parseEther("0.01"),
    });
    await tx.wait();
    console.log("✅ ZK proof 驗證成功，ETH 已退還");
  } catch (err) {
    console.error("❌ ZK proof 驗證失敗：", err.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

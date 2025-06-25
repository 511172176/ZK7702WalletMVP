// scripts/testValidatorProof.js
const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
  const proof = JSON.parse(fs.readFileSync("proof.json"));
  const publicSignals = JSON.parse(fs.readFileSync("public.json"));

  const { validator: VALIDATOR_ADDR } = JSON.parse(fs.readFileSync("deployed.json"));

  const ZKValidator = await ethers.getContractAt("ZKValidator", VALIDATOR_ADDR);

  const a = [proof.pi_a[0], proof.pi_a[1]];
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c = [proof.pi_c[0], proof.pi_c[1]];

  try {
    // optional: callStatic first to預測是否通過驗證
    await ZKValidator.callStatic.verifyAndSend(a, b, c, publicSignals, {
      value: ethers.utils.parseEther("0.01"),
    });
    console.log("✅ callStatic 成功，交易即將送出...");

    const tx = await ZKValidator.verifyAndSend(a, b, c, publicSignals, {
      value: ethers.utils.parseEther("0.01"),
    });
    await tx.wait();
    console.log("✅ ZK proof 驗證成功，ETH 已退還");
  } catch (err) {
    console.error("❌ ZK proof 驗證失敗：", err.message);
  }
}

main().catch((error) => {
  console.error("❌ 腳本錯誤:", error);
  process.exitCode = 1;
});

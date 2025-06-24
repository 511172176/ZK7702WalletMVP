// scripts/testValidate.js

const { ethers } = require("hardhat");

async function main() {
  // 1. 載入 proof 與 publicSignals（public.json 必須只含一個元素）
  const proof = require("../proof.json");
  const pub   = require("../public.json");

  // 2. 拿到部署好的 ZKValidator
  const validatorAddress = "0xC9a43158891282A2B1475592D5719c001986Aaec";  // ← 換成你自己的
  const [signer] = await ethers.getSigners();
  const zkValidator = await ethers.getContractAt(
    "ZKValidator",
    validatorAddress,
    signer
  );

  // 3. 準備 proof 的 A, B, C、以及編碼成 signature
  const a = [ proof.pi_a[0], proof.pi_a[1] ];
  const b = [
    [ proof.pi_b[0][1], proof.pi_b[0][0] ],
    [ proof.pi_b[1][1], proof.pi_b[1][0] ]
  ];
  const c = [ proof.pi_c[0], proof.pi_c[1] ];

  const sig = ethers.utils.defaultAbiCoder.encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[1]"],
    [ a, b, c, pub ]
  );
  console.log("📦 Encoded signature:", sig);

  // 4. 構造一個「極度簡化」的 UserOperation，只測 validateUserOp 這一步
  const dummyOp = {
    sender:               "0x0000000000000000000000000000000000000000",
    nonce:                0,
    initCode:             "0x",
    callData:             "0x",
    callGasLimit:         0,
    verificationGasLimit: 0,
    preVerificationGas:   0,
    maxPriorityFeePerGas: 0,
    maxFeePerGas:         0,
    paymasterAndData:     "0x",
    signature:            sig
  };

  // 5. 本地 callStatic 驗證
  try {
    await zkValidator.callStatic.validateUserOp(
      dummyOp,
      ethers.constants.HashZero,
      0
    );
    console.log("✅ 本地 CallStatic 驗證通過，ZK 部分沒問題！");
  } catch (e) {
    console.error("❌ 本地 CallStatic 驗證失敗：", e.message.split("\n")[0]);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

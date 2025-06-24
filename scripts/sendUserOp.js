// scripts/sendUserOp.js
const axios = require("axios");
const { ethers } = require("ethers");

async function main() {
  const RPC_URL     = "http://127.0.0.1:8545";
  const BUNDLER_URL = "http://127.0.0.1:3000/rpc";
  const provider    = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer      = provider.getSigner(0);
  const { chainId } = await provider.getNetwork();

  const ENTRYPOINT     = ethers.utils.getAddress("0x4337084d9e255ff0702461cf8895ce9e3b5ff108");
  const SIMPLE_ACCOUNT = ethers.utils.getAddress("0x114e375B6FCC6d6fCb68c7A1d407E652C54F25FB");
  const VALIDATOR_ADDR = ethers.utils.getAddress("0x67aD6EA566BA6B0fC52e97Bc25CE46120fdAc04c");
  const RECIPIENT      = ethers.utils.getAddress("0xcD0048A5628B37B8f743cC2FeA18817A29e97270");

  const ep = new ethers.Contract(ENTRYPOINT, [
    "function depositTo(address) payable",
    "function getNonce(address,uint192) view returns (uint256)"
  ], signer);

  console.log("💳 存 0.01 ETH 到 SimpleAccount");
  await ep.depositTo(SIMPLE_ACCOUNT, { value: ethers.utils.parseEther("0.01") });
  console.log("✅ 存款完成");

  const nonce = await ep.getNonce(SIMPLE_ACCOUNT, 0);
  const feeData = await provider.getFeeData();
  const echoIface = new ethers.utils.Interface(["function ping() public pure returns (string)"]);

  // 編碼 innerCall: validator.execute(to, value, data)
  const validatorIface = new ethers.utils.Interface([
    "function execute(bytes calldata)"
  ]);
  const innerCall = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "bytes"],
    [
      RECIPIENT, // Echo address
      ethers.utils.parseEther("0"), // 沒要轉錢就給 0
      echoIface.encodeFunctionData("ping", []) // 正確呼叫 ping()
    ]
  );

  // 編碼 account.execute(validatorAddr, 0, innerCall)
  const accountIface = new ethers.utils.Interface([
    "function execute(address,uint256,bytes)"
  ]);
  const callData = accountIface.encodeFunctionData("execute", [
    VALIDATOR_ADDR,
    0,
    validatorIface.encodeFunctionData("execute", [innerCall])
  ]);

  // 載入 ZK proof 並 encode 成 signature
  const proof = require("../proof.json");
  const a = [proof.pi_a[0], proof.pi_a[1]];
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c = [proof.pi_c[0], proof.pi_c[1]];
  const pub = [1]; // 根據你的電路需求

  const zkSignature = ethers.utils.defaultAbiCoder.encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[1]"],
    [a, b, c, pub]
  );

  console.log("✉️ ZK signature:", zkSignature);

  const userOp = {
    sender: SIMPLE_ACCOUNT,
    nonce: nonce.toHexString(),
    initCode: "0x",
    callData,
    callGasLimit: "0x186a0",
    verificationGasLimit: "0x30d40",
    preVerificationGas: "0x0c350",
    maxFeePerGas: feeData.maxFeePerGas.toHexString(),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.toHexString(),
    paymasterAndData: "0x",
    signature: zkSignature
  };

  // 驗證 validator.callStatic
  const validator = new ethers.Contract(VALIDATOR_ADDR, [
    "function validateUserOp((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes32,uint256) returns (uint256)"
  ], signer);

  const fakeHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode([
      "address", "uint256", "bytes", "bytes",
      "uint256", "uint256", "uint256", "uint256", "uint256",
      "bytes", "bytes"
    ], [
      userOp.sender, userOp.nonce, userOp.callData, userOp.initCode,
      userOp.callGasLimit, userOp.verificationGasLimit, userOp.preVerificationGas,
      userOp.maxFeePerGas, userOp.maxPriorityFeePerGas,
      userOp.paymasterAndData, userOp.signature
    ])
  );

  const userOpTuple = [
    userOp.sender, userOp.nonce, userOp.initCode, userOp.callData,
    userOp.callGasLimit, userOp.verificationGasLimit, userOp.preVerificationGas,
    userOp.maxFeePerGas, userOp.maxPriorityFeePerGas,
    userOp.paymasterAndData, userOp.signature
  ];

  try {
    await validator.callStatic.validateUserOp(userOpTuple, fakeHash, 0);
    console.log("✅ 本地靜態：validateUserOp() 通過");
  } catch (e) {
    console.error("❌ 本地靜態：validateUserOp() 失敗", e);
    process.exit(1);
  }

  console.log("🔑 正在發送到 Bundler…");
  const resp = await axios.post(
    BUNDLER_URL,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendUserOperation",
      params: [userOp, ENTRYPOINT, chainId]
    },
    { headers: { "Content-Type": "application/json" } }
  );

  if (resp.data.error) {
    console.error("❌ Bundler error:", resp.data.error);
    process.exit(1);
  }

  console.log("✅ userOpHash:", resp.data.result);
}

main().catch(e => {
  console.error("❌ 腳本異常:", e);
  process.exit(1);
});

async function submitTx() {
  console.log("🔍 submitTx 被呼叫");

  const response = await fetch("../proof/proof.json");
  const proofJson = await response.json();
  const proof = ethers.utils.arrayify(proofJson.proof);

  const signalsRes = await fetch("../proof/public.json");
  const pubSignalsRaw = await signalsRes.json();
  const pubSignals = pubSignalsRaw.map(x => ethers.BigNumber.from(x).toString());

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();

  const validatorAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"; // 替換成你的合約地址
  const validatorAbi = [
    {
      inputs: [
        { internalType: "bytes", name: "proof", type: "bytes" },
        { internalType: "uint256[]", name: "pubSignals", type: "uint256[]" }
      ],
      name: "validateUserOp",
      outputs: [
        { internalType: "bool", name: "", type: "bool" }
      ],
      stateMutability: "view",
      type: "function"
    }
  ];

  const validator = new ethers.Contract(validatorAddress, validatorAbi, signer);

  try {
    const isValid = await validator.validateUserOp(proof, pubSignals);
    if (isValid) {
      alert("✅ 驗證通過，可執行交易");

      const tx = await signer.sendTransaction({
        to: "0x000000000000000000000000000000000000dEaD",
        value: ethers.utils.parseEther("0.01")
      });

      await tx.wait();
      alert("🚀 交易已送出 (0.01 ETH → 0x...dead)");
    } else {
      alert("❌ 驗證失敗，交易中止");
    }
  } catch (err) {
    console.error("呼叫驗證時發生錯誤:", err);
    alert("❌ 發生錯誤，請查看 console log");
  }
}

window.submitTx = submitTx;
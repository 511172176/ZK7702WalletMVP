async function submitTx() {
  console.log("🔍 submitTx 被呼叫");

  const rawProof = await fetch("../proof.json").then(res => res.json());
  const publicInputs = await fetch("../public.json").then(res => res.json());

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();

  const validatorAddress = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";
  const validatorAbi = [
    {
      name: "verifyAndSend",
      type: "function",
      stateMutability: "payable",
      inputs: [
        { name: "_pA", type: "uint256[2]" },
        { name: "_pB", type: "uint256[2][2]" },
        { name: "_pC", type: "uint256[2]" },
        { name: "_pubSignals", type: "uint256[1]" }
      ],
      outputs: []
    }
  ];

  const validator = new ethers.Contract(validatorAddress, validatorAbi, signer);

  try {
    const a = [rawProof.pi_a[0], rawProof.pi_a[1]];
    const b = [
      [rawProof.pi_b[0][1], rawProof.pi_b[0][0]],
      [rawProof.pi_b[1][1], rawProof.pi_b[1][0]]
    ];
    const c = [rawProof.pi_c[0], rawProof.pi_c[1]];
    const input = publicInputs;

    const tx = await validator.verifyAndSend(a, b, c, input, {
      value: ethers.utils.parseEther("0.01")
    });

    await tx.wait();
    alert("🚀 交易已送出 (0.01 ETH → 0x...dead)");

  } catch (err) {
    console.error("❌ 驗證或交易失敗:", err);
    alert("❌ 發生錯誤，請查看 console log");
  }
}

window.submitTx = submitTx;

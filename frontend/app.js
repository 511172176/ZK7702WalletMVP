async function submitTx() {
  console.log("🔍 submitTx 被呼叫");

  const [proof, publicInputs, deployed] = await Promise.all([
    fetch("../proof.json").then(res => res.json()),
    fetch("../public.json").then(res => res.json()),
    fetch("../deployed.json").then(res => res.json())
  ]);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();

  // STEP 1: 先儲值給合約
  const fundTx = await signer.sendTransaction({
    to: deployed.zkAccount,
    value: ethers.utils.parseEther("0.01")
  });
  await fundTx.wait();
  console.log("✅ ETH 已轉入 ZK 合約");

  // STEP 2: ZK proof 組合
  const a = [proof.pi_a[0], proof.pi_a[1]];
  const b = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],
    [proof.pi_b[1][1], proof.pi_b[1][0]]
  ];
  const c = [proof.pi_c[0], proof.pi_c[1]];
  const input = publicInputs;
  const zkSignature = new ethers.utils.AbiCoder().encode(
    ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[1]"],
    [a, b, c, input]
  );

  // STEP 3: 執行合約出金
  const zkAccount = new ethers.Contract(
    deployed.zkAccount,
    [
      "function execute(bytes zkSignature,address dest,uint256 value,bytes data) external"
    ],
    signer
  );

  const dest = "0x000000000000000000000000000000000000dEaD"; // 黑洞
  const value = ethers.utils.parseEther("0.01");
  const callData = "0x";

  const execTx = await zkAccount.execute(zkSignature, dest, value, callData);
  await execTx.wait();

  alert("🎉 ZK 驗證成功，ETH 已轉至黑洞地址");
}
window.submitTx = submitTx;

// scripts/buildTree.js
const fs = require("fs");
const { buildPoseidon } = require("circomlibjs");
const { IncrementalMerkleTree } = require("@zk-kit/incremental-merkle-tree");
const { utils } = require("ethers");

async function buildWhitelist() {
  // 1. 初始化 Poseidon
  const poseidon = await buildPoseidon();

  // 2. 建立 Merkle Tree
  //    第1個參數要傳「hash function」，必須是一個 (bigint[]) => bigint 函式
  const tree = new IncrementalMerkleTree(
    // hashFn: 把 poseidon 的 Field 回傳值轉成 JS BigInt
    (leaves) => poseidon.F.toObject(poseidon(leaves)),
    20,           // depth
    BigInt(0),    // zero value
    2             // arity
  );

  // 3. 白名單地址清單
  const addresses = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
    '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
    '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
    '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
    '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
    '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
  ];

  let targetLeaf = null;
  for (const addr of addresses) {
    // 用 keccak256(addr) 當作 Poseidon 的輸入
    const hashHex = utils.keccak256(utils.toUtf8Bytes(addr));
    const hashInput = BigInt(hashHex);
    // Poseidon 回傳一個 Field 元件，要轉成原始 bigint
    const leaf = poseidon.F.toObject(poseidon([hashInput]));

    tree.insert(leaf);

    // 我們取第一個地址當驗證樣本
    if (targetLeaf === null) {
      targetLeaf = leaf;
    }
  }

  // 4. 產生 proof
  const proof = tree.createProof(tree.indexOf(targetLeaf));

  // 5. 輸出給 Circom 的 input.json
  const input = {
    leaf:       targetLeaf.toString(),
    root:       tree.root.toString(),
    pathElements: proof.siblings.map((s) => s.toString()),
    pathIndices:  proof.pathIndices
  };

  fs.writeFileSync("input.json", JSON.stringify(input, null, 2));
  console.log("✅ input.json 已成功產出");
}

buildWhitelist().catch((err) => {
  console.error(err);
  process.exit(1);
});

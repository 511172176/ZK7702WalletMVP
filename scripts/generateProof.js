const fs = require('fs');

function generateMockProof(leaf) {
  return {
    proof: "0x11223344556677889900aabbccddeeff00112233445566778899aabbccddeeff",
    publicSignals: [
      "123456789",
      "98765432109876543210"
    ]
  };
}

const leaf = process.argv[2] || "0xabc123";
const { proof, publicSignals } = generateMockProof(leaf);

if (!fs.existsSync('proof')) fs.mkdirSync('proof');
fs.writeFileSync('proof/proof.json', JSON.stringify(proof, null, 2));
fs.writeFileSync('proof/public.json', JSON.stringify(publicSignals, null, 2));

console.log('✅ Mock ZK proof generated');

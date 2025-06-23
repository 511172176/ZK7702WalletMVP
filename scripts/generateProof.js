const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() {
  const input = JSON.parse(fs.readFileSync("proof/input.json"));

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "build/isWhitelisted_js/isWhitelisted.wasm",
    "build/circuit_final.zkey"
  );

  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const [a, b, c, inputSignals] = JSON.parse("[" + calldata + "]");

  fs.writeFileSync("proof/proof.json", JSON.stringify({ a, b, c }, null, 2));
  fs.writeFileSync("proof/public.json", JSON.stringify(inputSignals, null, 2));
}

main();

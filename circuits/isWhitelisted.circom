// circuits/isWhitelisted.circom
pragma circom 2.0.0;
include "poseidon.circom";

template Selector() {
    signal input a;
    signal input b;
    signal input sel;
    signal output out;
    signal diff;
    signal prod;

    diff <== b - a;
    prod <== sel * diff;
    out  <== a + prod;
}

// 驗證 Merkle Proof：從 leaf 到 root，深度可調
template MerkleProof(depth) {
    signal input leaf;
    signal input root;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal output isValid;

    signal cur[depth + 1];
    cur[0] <== leaf;

    component hashers[depth];
    component sel0[depth];
    component sel1[depth];

    for (var i = 0; i < depth; i++) {
        hashers[i] = Poseidon(2);
        sel0[i]    = Selector();
        sel1[i]    = Selector();

        sel0[i].a   <== cur[i];
        sel0[i].b   <== pathElements[i];
        sel0[i].sel <== pathIndices[i];
        hashers[i].inputs[0] <== sel0[i].out;

        sel1[i].a   <== pathElements[i];
        sel1[i].b   <== cur[i];
        sel1[i].sel <== pathIndices[i];
        hashers[i].inputs[1] <== sel1[i].out;

        cur[i + 1] <== hashers[i].out;
    }

    signal diff;
    diff <== cur[depth] - root;
    isValid <== 1 - diff * diff;
}

component main = MerkleProof(20);

pragma circom 2.0.0;

include "circomlib/poseidon.circom";

template IsWhitelisted() {
    signal input leaf;
    signal input root;
    signal input pathElements[3];
    signal input pathIndices[3];
    signal output isInTree;

    component hashers[3];
    var cur = leaf;
    for (var i = 0; i < 3; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== pathIndices[i] == 0 ? cur : pathElements[i];
        hashers[i].inputs[1] <== pathIndices[i] == 0 ? pathElements[i] : cur;
        cur <== hashers[i].out;
    }
    isInTree <== cur === root;
}

component main = IsWhitelisted();
// circuits/incrementalMerkleTree.circom
pragma circom 2.0.0;
include "poseidon.circom";

// 一維選擇元件：若 sel=0 回傳 a，sel=1 回傳 b
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

// 遞增式 Merkle Tree：輸入 leaf, 路徑 elements/indices，輸出 root 並額外暴露 root 作為 input
template IncrementalMerkleTree(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal input root;           // 額外加上 root 作為驗證用
    signal output isEqual;       // 額外輸出是否一致

    // 一維 cur array 儲存每層節點
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

    // 計算完的 root 跟輸入的 root 比對
    signal diff;
    diff <== cur[depth] - root;
    isEqual <== 1 - diff * diff;
}

component main = IncrementalMerkleTree(20);

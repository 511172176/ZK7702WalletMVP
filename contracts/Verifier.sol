// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Mock verifier (replace with snarkjs-generated verifier)
contract Verifier {
    function verifyProof(bytes calldata, uint256[] calldata) external pure returns (bool) {
        return true;
    }
}
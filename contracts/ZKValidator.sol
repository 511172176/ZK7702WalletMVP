// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifier {
    function verifyProof(bytes calldata proof, uint256[] calldata pubSignals) external view returns (bool);
}

contract ZKValidator {
    IVerifier public verifier;

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    function validateUserOp(bytes calldata proof, uint256[] calldata pubSignals) external view returns (bool) {
        require(verifier.verifyProof(proof, pubSignals), "Invalid ZK proof");
        return true;
    }
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[1] memory input
    ) external view returns (bool);
}

contract ZK7702Account {
    IVerifier public immutable verifier;

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    function execute(
        bytes calldata zkSignature,
        address dest,
        uint256 value,
        bytes calldata data // 你可以永遠填 "0x"
    ) external {
        require(_verifyProof(zkSignature), "invalid proof");
        (bool success, ) = dest.call{value: value}(data);
        require(success, "call failed");
    }

    function _verifyProof(bytes calldata zkSignature) internal view returns (bool) {
        (
            uint256[2] memory a,
            uint256[2][2] memory b,
            uint256[2] memory c,
            uint256[1] memory input
        ) = abi.decode(zkSignature, (uint256[2], uint256[2][2], uint256[2], uint256[1]));
        return verifier.verifyProof(a, b, c, input);
    }

    receive() external payable {}
}

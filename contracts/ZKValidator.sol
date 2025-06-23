// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./Verifier.sol";

/// @title ZK 驗證器 + 轉帳示例
/// @notice 使用 Groth16Verifier.verifyProof 驗證 ZK proof，通過後退還 msg.value
contract ZKValidator {
    Groth16Verifier public verifier;

    /// @param _verifier Groth16Verifier 合約地址
    constructor(address _verifier) {
        verifier = Groth16Verifier(_verifier);
    }

    /// @notice 驗證 ZK proof，通過後退還 msg.value
    /// @param _pA Proof 的 A 部分，uint[2]
    /// @param _pB Proof 的 B 部分，uint[2][2]
    /// @param _pC Proof 的 C 部分，uint[2]
    /// @param _pubSignals 公共信號，uint[1]
    function verifyAndSend(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[1] calldata _pubSignals
    ) external payable {
        // 調用 Groth16Verifier 的 verifyProof
        require(verifier.verifyProof(_pA, _pB, _pC, _pubSignals), "Invalid ZK proof");

        // 驗證通過，退還 ETH 給 msg.sender
        (bool sent, ) = msg.sender.call{value: msg.value}("");
        require(sent, "Refund failed");
    }
}
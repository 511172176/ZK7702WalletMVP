// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./Verifier.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "./interfaces/UserOperation.sol";

contract ZKValidator {
    Groth16Verifier public verifier;

    constructor(address _verifier) {
        verifier = Groth16Verifier(_verifier);
    }

    /// @dev 支援 ERC-4337 的驗證函數
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32, // userOpHash
        uint256 // missingAccountFunds
    ) external returns (uint256 validationData) {
        (
            uint256[2] memory _pA,
            uint256[2][2] memory _pB,
            uint256[2] memory _pC,
            uint256[1] memory _pubSignals
        ) = abi.decode(userOp.signature, (uint256[2], uint256[2][2], uint256[2], uint256[1]));

        bool ok = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(ok, "Invalid ZK proof");

        return 0; // 0 = valid
    }

    /// @dev 給 ZK 驗證通過後執行 call 的方式
    function execute(bytes calldata callData) external {
        (address to, uint256 value, bytes memory data) = abi.decode(callData, (address, uint256, bytes));
        (bool success, bytes memory returndata) = to.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(returndata, 32), mload(returndata))
            }
        }
    }


    receive() external payable {}
}

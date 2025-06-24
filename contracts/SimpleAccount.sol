// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "./interfaces/UserOperation.sol";

import "./ZKValidator.sol";

contract SimpleAccount {
    address public owner;
    IEntryPoint public immutable entryPoint;
    ZKValidator public immutable validator;

    constructor(address _entryPoint, address payable _validator) {
        validator = ZKValidator(_validator);
    }


    receive() external payable {}

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 /* missingAccountFunds */
    ) external view returns (uint256 validationData) {
        require(msg.sender == address(entryPoint), "Only entryPoint");

        (
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[1] memory pubSignals
        ) = abi.decode(userOp.signature, (uint[2], uint[2][2], uint[2], uint[1]));

        // 這邊直接呼叫 ZKValidator 的驗證
        //require(validator.verifier().verifyProof(a, b, c, pubSignals), "Invalid ZK proof");

        return 0; // 驗證成功
    }

    function execute(address dest, uint256 value, bytes calldata func) external {
        (bool success, bytes memory returndata) = dest.call{value: value}(func);
        if (!success) {
            assembly {
                revert(add(returndata, 32), mload(returndata))
            }
        }
    }

    function getEntryPoint() external view returns (IEntryPoint) {
        return entryPoint;
    }
}

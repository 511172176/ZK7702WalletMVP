// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Echo {
    function ping() external pure returns (string memory) {
        return "pong";
    }
}

// contracts/Echo.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Echo {
    event Called(string msg);
    event Pinged(address sender); // 新增事件

    fallback() external payable {
        emit Called("fallback called");
    }

    receive() external payable {
        emit Called("receive called");
    }

    function ping() public returns (string memory) { // 改掉 pure
        emit Pinged(msg.sender);
        return "pong";
    }
}

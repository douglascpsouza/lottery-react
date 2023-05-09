// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

contract Lottery {
    address public manager;
    address public latestWinner;
    address payable[] public players;

    constructor() {
        manager = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == manager, "Manager access only");
        _;
    }

    function enter() public payable {
        require(msg.value >= .01 ether, "Minimum value to enter lottery is 0.01 ETH");
        players.push(payable(msg.sender));
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }
 
    // Random Number Generator
    function randomNumberGenerator() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players)));
    }

    function pickWinner() public restricted {
        uint winnerIndex = randomNumberGenerator() % players.length;
        latestWinner = players[winnerIndex];
        payable(latestWinner).transfer(address(this).balance);
        // delete players;
        players = new address payable[](0);
    }
}

pragma solidity ^0.4.0;

import './owned.sol';

contract TestContract2 is Owned {
    uint state = 1;
    uint constant public maxState = 3;

    bytes32 constant public checksum = 0xfb8457d54150b5a58919e798703db1e4bf7406900619db3eac676f82fa915214; // multihash https://github.com/multiformats/multihash

    constructor(address _owner) public {
        owner = _owner;
    }

    function getState() public constant returns (uint _num) {
        return state;
    }

    function nextState() external ownerOnly {
        require(state + 1 <= maxState, "Maximum state number is 3");
        state++;
    }
}

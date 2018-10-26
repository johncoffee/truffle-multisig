pragma solidity ^0.4.0;

import './owned.sol';

contract TestContract1 is Owned {
    uint state = 1;

    constructor(address _owner) public {
        owner = _owner;
    }

    function getState() public constant returns (uint _num) {
        return state;
    }

    function nextState() external ownerOnly {
        state++;
    }
}

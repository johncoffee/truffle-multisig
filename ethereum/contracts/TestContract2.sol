pragma solidity ^0.4.0;

import './owned.sol';

contract TestContract2 is Owned {
    uint state = 1;
    uint maxState = 3;

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

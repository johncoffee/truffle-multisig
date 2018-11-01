pragma solidity ^0.4.0;

import './owned.sol';

contract SimpleContract is Owned {
    uint state = 1;

    constructor(address _owner) Owned(_owner) public {
    }

    function getState() public constant returns (uint _num) {
        return state;
    }

    function nextState() external ownerOnly {
        state++;
    }
}

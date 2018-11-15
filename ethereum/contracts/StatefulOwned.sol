pragma solidity ^0.4.0;

import './Owned.sol';

contract StatefulOwned is Owned {
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

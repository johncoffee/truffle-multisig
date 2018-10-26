pragma solidity ^0.4.0;

import './owned.sol';

contract ComplexContract is Owned {

    // states: 1 = draft
    //         2 = active
    //         3 = terminated
    uint public state = 1; // defaults to draft

    bytes32 public constant terms = 0x111;

    uint8 public constant startupFee = 2000 wei;
    uint8 public constant totalPrice = 30000 wei;

    address private paymentsTo = 0x001;

    constructor(address _owner) public {
        owner = _owner;
    }

    function goToNextState() external ownerOnly {
        uint nextState = state + 1;

        if (nextState == 2) {
            require(paymentsTo.balance >= startupFee, "paymentsTo did not hold the amount of startupFee to enter state 2");
        }
        else if (nextState == 3) {
            require(paymentsTo.balance >= totalPrice, "paymentsTo did not hold the amount of totalPrice to enter state 3");
        }

        state = nextState;
    }
}

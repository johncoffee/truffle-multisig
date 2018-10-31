pragma solidity ^0.4.0;

import './owned.sol';

contract ComplexContract is Owned {

    // states: 1 = draft
    //         2 = active
    //         3 = terminated
    uint public state = 1; // defaults to draft

    bytes32 public constant terms = 0x111;

    uint public constant startupFee = 2000 wei;
    uint public constant totalPrice = 30000 wei;

    address public paymentsTo;

    constructor(address _owner, address _paymentsTo) public {
        owner = _owner;
        paymentsTo = _paymentsTo;
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

pragma solidity ^0.4.0;

import './owned.sol';
import "./ICommonState.sol";

contract Sp1 is ICommonState, Owned {

    // states: 1 = draft
    //         2 = active
    //         3 = terminated
    uint public state = 1; // defaults to draft

    bytes32 public constant terms = 0x123;
    uint public constant totalPrice = 60000 wei;
    address public paymentsTo;
    ICommonState public subcontract;

    constructor(address _owner, address _paymentsTo) Owned(_owner) public {
        paymentsTo = _paymentsTo;
    }

    function activate() external ownerOnly {
        require(state == 1, "current state was not 1");
        state = 2;
    }

    function terminate() external ownerOnly {
        require(state == 2, "current state was not 2");

        require(paymentsTo.balance >= totalPrice, "paymentsTo did not hold the amount of totalPrice to enter state 3");

        require(subcontract.getState() == 3, "subcontract state was not 3");

        state = 3;
    }
}

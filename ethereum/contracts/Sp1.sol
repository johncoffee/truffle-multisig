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
    address public serviceProvider;
    ICommonState public subcontract;

    constructor(address _owner, address _serviceProvider)
        Owned(_owner) public {
        serviceProvider = _serviceProvider;
    }

    // sub contracts

    function add(ICommonState _subcontract) public {
        require(msg.sender == serviceProvider);
        subcontract = ICommonState(_subcontract);
    }

    // state

    function activate() external ownerOnly {
        require(state == 1, "current state was not 1");
        state = 2;
    }

    function terminate() external ownerOnly {
        require(state == 2, "current state was not 2");

        require(serviceProvider.balance >= totalPrice, "payment address did not hold enough ether to enter state 3");

        require(subcontract.getState() == 3, "subcontract state was not 3");

        state = 3;
    }

    // implementation of ICommonState
    function getState() external constant returns(uint) {
        return state;
    }
    function countSubcontracts() external constant returns(uint) {
        return 0;
    }
    function getSubcontract(uint _index) external constant returns(address) {
        return subcontract;
    }
}

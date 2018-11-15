pragma solidity ^0.4.0;

import './Owned.sol';
import "./ICommonState.sol";
import "./CommonStates.sol";

contract MultisigTerminate is ICommonState, CommonStates, Owned {
    uint public state = ACTIVE;

    address public paymentAddress;
    bytes32 public externalDocument = 0x0;
    uint public totalPrice = 10 ether;

    constructor(address _owner, address _paymentAddress) Owned(_owner) public {
        paymentAddress = _paymentAddress;
    }

    function terminate() external ownerOnly {
        require(paymentAddress.balance >= totalPrice);
        state = TERMINATED;
    }

    // implementation of ICommonState
    function getState() external constant returns(uint) {
        return state;
    }
    function countSubcontracts() external constant returns(uint) {
        return 0;
    }
    function getSubcontract(uint _index) external constant returns(address) {
        return address(_index);
    }
}

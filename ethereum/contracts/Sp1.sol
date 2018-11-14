pragma solidity ^0.4.0;

import './Owned.sol';
import "./ICommonState.sol";
import "./CommonStates.sol";

contract Sp1 is ICommonState, CommonStates, Owned {

    uint public state = ACTIVE; // defaults to draft

    // 32 bytes hash of an external document
    bytes32 public documentChecksum;

    // the price
    uint public constant totalPrice = 60000 wei;

    // the address where the price payments goes to
    address public serviceProvider;

    // address of the sub contract
    ICommonState public subcontract;
    // count number of sub contracts (here we only have 1, see also the `add` method)
    uint public numSubcontracts;

    modifier serviceProviderOnly {
        require(msg.sender == serviceProvider);
        _;
    }

    constructor(address _owner, address _serviceProvider)
        Owned(_owner) public {
        serviceProvider = _serviceProvider;
    }

    // sub contracts

    function add(ICommonState _subcontract) serviceProviderOnly external {
        numSubcontracts = 1;
        subcontract = ICommonState(_subcontract);
    }

    // state

    function activate() external ownerOnly {
        require(state == DRAFT, "current state was not DRAFT");
        state = ACTIVE;
    }

    function terminate() external ownerOnly {
        require(state == ACTIVE, "current state was not ACTIVE");

        require(serviceProvider.balance >= totalPrice, "payment address did not hold enough ether to enter state 3");

        require(subcontract.getState() == TERMINATED, "subcontract state was not 3");

        state = TERMINATED;
    }

    function setDocumentChecksum(bytes32 _checksum) serviceProviderOnly {
        documentChecksum = _checksum;
    }

    // implementation of ICommonState
    function getState() external constant returns(uint) {
        return state;
    }
    function countSubcontracts() external constant returns(uint) {
        return numSubcontracts;
    }
    function getSubcontract(uint _index) external constant returns(address) {
        return subcontract;
    }
}

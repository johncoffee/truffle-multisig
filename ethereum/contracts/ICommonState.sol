pragma solidity ^0.4.0;

import './Owned.sol';

interface ICommonState {
    function getState() external constant returns(uint);
    function countSubcontracts() external constant returns(uint);
    function getSubcontract(uint _index) external constant returns(address);
}

interface IHasSubcontracts {
    function add(ICommonState _subcontract) external;
}
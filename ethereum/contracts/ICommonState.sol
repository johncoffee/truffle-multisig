pragma solidity ^0.4.0;

import './owned.sol';

interface ICommonState {
    function getState() external constant returns(uint);
    function countState(uint _state) external constant returns(uint);
}

pragma solidity ^0.4.22;

contract Owned {
    address owner;

    constructor(address _owner) public {
        owner = _owner;
    }

    modifier ownerOnly () {
        require(owner == msg.sender, "msg.sender was not owner");
        _;
    }

    function getOwner() public constant returns (address _owner) {
        return owner;
    }
}

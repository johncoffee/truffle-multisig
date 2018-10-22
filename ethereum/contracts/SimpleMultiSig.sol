pragma solidity ^0.4.22;

contract SimpleMultiSig {

  uint public nonce;                 // (only) mutable state
  uint public threshold;             // immutable state
  mapping (address => bool) public isOwner; // immutable state
  address[] public ownersArr;        // immutable state

  // Note that owners_ must be strictly increasing, in order to prevent duplicates
  constructor(uint threshold_, address[] owners_) public {
    require(owners_.length <= 10, "owners must be less than 10");
    require(threshold_ <= owners_.length, "threshold must not be greater than number of owners");
    require(threshold_ >= 0, "thresholds has to be or larger");

    address lastAdd = address(0);
    for (uint i = 0; i < owners_.length; i++) {
      require(owners_[i] > lastAdd, "problem with order of owners");
      isOwner[owners_[i]] = true;
      lastAdd = owners_[i];
    }
    ownersArr = owners_;
    threshold = threshold_;
  }

  // Note that address recovered from signatures must be strictly increasing, in order to prevent duplicates
  function execute(uint8[] sigV, bytes32[] sigR, bytes32[] sigS, address destination, uint value, bytes data) public {
    require(sigR.length == threshold, "number of input signatures doesn't match threshold");
    require(sigR.length == sigS.length && sigR.length == sigV.length, "lengths of V, R, S is not equal");

    // Follows ERC191 signature scheme: https://github.com/ethereum/EIPs/issues/191
    bytes32 txHash = keccak256(byte(0x19), byte(0), this, destination, value, data, nonce);

    address lastAdd = address(0); // cannot have address(0) as an owner
    for (uint i = 0; i < threshold; i++) {
      address recovered = ecrecover(txHash, sigV[i], sigR[i], sigS[i]);
      require(recovered != address(0), "ecrecovered address must not be 0");
      require(recovered > lastAdd, "problem with order of signers");
      require(isOwner[recovered] == true, "ecrecovered address should be owner");
      lastAdd = recovered;
    }

    // If we make it here all signatures are accounted for.
    // The address.call() syntax is no longer recommended, see:
    // https://github.com/ethereum/solidity/issues/2884
    nonce = nonce + 1;
    bool success = false;
    assembly { success := call(gas, destination, value, add(data, 0x20), mload(data), 0, 0) }
    require(success, "calling destination method failed, for unknown reasons");
  }

  function testRecover(uint8 sigV, bytes32 sigR, bytes32 sigS, address destination, uint value, bytes data) public returns(address recovered) {
    // Follows ERC191 signature scheme: https://github.com/ethereum/EIPs/issues/191
    bytes32 txHash = keccak256(byte(0x19), byte(0), this, destination, value, data, nonce);
    return ecrecover(txHash, sigV, sigR, sigS);
  }

  function () payable public {}
}

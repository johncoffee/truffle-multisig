const SimpleMultiSig = artifacts.require("SimpleMultiSig")
const ComplexContract = artifacts.require("ComplexContract") // contract name, not solidity file name

module.exports = function(deployer, network, accounts) {
  const owners = [
    accounts[0],
    '0x86bb7242fdb7c4b809497f48855a88823ba5255e',
  ]
  owners.sort()
  const threshold = owners.length // all owners must sign

  // seems like async/await not really supported, we have to follow this API
  deployer
    .then(() => deployer.deploy(SimpleMultiSig, threshold, owners))
    .then((simpleMultiSigInstance) => deployer.deploy(ComplexContract, simpleMultiSigInstance.address)) // pass address to the constructor
}

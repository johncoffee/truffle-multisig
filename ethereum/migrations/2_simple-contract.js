const SimpleMultiSig = artifacts.require("SimpleMultiSig")
const SimpleContract = artifacts.require("SimpleContract")

module.exports = function(deployer, network, accounts) {
  const owners = [
    '', // accounts[0] // perhaps
    '',
  ]
  owners.sort() // sorted, as required by the multisig logic
  const threshold = owners.length // all owners must sign

  // seems like async/await not really supported, we have to follow this API
  deployer
    .then(() => deployer.deploy(SimpleMultiSig, threshold, owners))
    .then((simpleMultiSigInstance) => deployer.deploy(SimpleContract, simpleMultiSigInstance.address)) // pass address to the constructor
}

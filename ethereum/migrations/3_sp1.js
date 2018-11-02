const Sp1 = artifacts.require("Sp1")

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Sp1, accounts[0], accounts[1])
}

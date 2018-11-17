const Sp1 = artifacts.require("K1")

module.exports = function(deployer, network, accounts) {

  const municipality = accounts[0]
  const serviceProvider = accounts[1]
  const school = accounts[2]

  // seems like async/await not really supported, we have to follow this API

  let sp1InstanceParent

  deployer
    .then(() => deployer.deploy(Sp1, municipality, serviceProvider) )
    .then(instance => {
      // sp1Instance.
      console.log("  TEST SP _1_  " + instance.address)
      sp1InstanceParent = instance
      return deployer.deploy(Sp1, serviceProvider, school)
    })
    .then(instance => {
      console.log("  TEST SP _1_2 " + instance.address)
      return sp1InstanceParent.add(instance.address, {from: serviceProvider})
    })

}

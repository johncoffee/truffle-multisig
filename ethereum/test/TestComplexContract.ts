import { ComplexContractInstance, SimpleMultiSigInstance } from '../build/contract-interfaces'

const ComplexContract = artifacts.require("ComplexContract")
const SimpleMultiSig = artifacts.require("SimpleMultiSig")

contract('ComplexContract', ([deployer]) => {

  describe('public fields ', () => {

    let instanceSimpleMultiSig :SimpleMultiSigInstance
    let instance :ComplexContractInstance

    beforeEach(async () => {
      const owners = [
        '0x86bb7242fdb7c4b809497f48855a88823ba5255e', deployer,
      ]
      owners.sort()
      instanceSimpleMultiSig = await SimpleMultiSig.new(2, owners)
      instance = await ComplexContract.new(instanceSimpleMultiSig.address)
    })

    it("should have a state", async () => {
      const state = await instance.state()
      assert.strictEqual(state.toString(), '1', 'should start in state 1')
    })

    it("should have a start fee", async () => {
      const fee = await instance.startupFee()
      expect(fee.toNumber()).to.be.greaterThan(0, 'should start in state 1')
    })

    it("should have price", async () => {
      const price = await instance.totalPrice()
      expect(price.toNumber()).to.be.greaterThan(0, 'should start in state 1')
    })

    it("should have terms", async () => {
      const c = await instance.terms()
      assert.strictEqual(c.toString() === '0x0000000000000000000000000000000000000000000000000000000000000000', false, "terms should be set to some bytes")
    })
  })

})

export {}

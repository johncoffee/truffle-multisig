import { join } from 'path'
const Web3 = require('web3')

export async function create (constructorArguments:string[], template:string, from:string):Promise<void> {
  const web3 = new Web3('http://localhost:7545')

  const artifact = require(join(__dirname,`../../ethereum/build/contracts/${template}.json`))

  const metaInstance = new web3.eth.Contract(artifact.abi)

  const deployed = await metaInstance
    .deploy({
      data: artifact.bytecode,
      arguments: constructorArguments,
    })
    .send({
      from: from,
      gas: 1000000,
    })

  // console.debug(Object.keys(deployed.methods))
  console.log(`Deployed to ${deployed.options.address}`)
  return deployed
}


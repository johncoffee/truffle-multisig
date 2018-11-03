import { join } from 'path'

export async function create (from:string, serviceProvider:string, name:string, web3:any):Promise<void> {
  const artifact = require(join(__dirname,`../../ethereum/build/contracts/${name}.json`))

  const metaInstance = new web3.eth.Contract(artifact.abi)

  const deployed = await metaInstance
    .deploy({
      data: artifact.bytecode,
      arguments: [from, serviceProvider],
    })
    .send({
      from: from,
      gas: 1000000,
    })

  // console.debug(Object.keys(deployed.methods))
  console.log(`Deployed to ${deployed.options.address}`)
  return deployed
}


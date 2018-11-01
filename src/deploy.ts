import { join } from 'path'

export async function deploy (from:string, web3:any) {
  const artifact = require(join(__dirname,'../ethereum/build/contracts/SimpleContract.json'))

  const multisigInstance = new web3.eth.Contract(artifact.abi)

  const instance = await multisigInstance
    .deploy({
      data: artifact.bytecode,
      arguments: [from],
    })
    .send({
      from: from,
      gas: 1000000,
    })

  return instance
}


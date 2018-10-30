import { extname, join } from 'path'
import { Item, Options } from 'klaw'
import * as klaw from 'klaw'
import { ensureDir, readJSON } from 'fs-extra'

const opts = <Options>{
  filter: filePath => extname(filePath) === ".json",
}

const contractsPath = join(__dirname, "../ethereum/build/contracts/")

type json = {[k :string]: any}

export async function getDeployedContracts(networkId:string):Promise<json[]> {
  return new Promise<json[]>(resolve => {
    const reads = <Promise<any>[]>[]

    klaw(contractsPath, opts)
      .on('data', item => {
        if (!item.stats.isDirectory()) {
          reads.push( readJSON(item.path) )
        }
      })
      .on('end', async () => {
        const items:json[] = await Promise.all(reads)

        const filtered = items
          .filter(contract => contract.contractName !== 'Migrations'   // filter out Truffle migration tracking
            && contract.networks[networkId]
            && Object.keys(contract.networks[networkId]).length > 0)

        resolve(filtered)
      })
  })
}


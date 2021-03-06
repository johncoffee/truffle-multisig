import { extname, join } from 'path'
import { Item, Options } from 'klaw'
import * as klaw from 'klaw'
import { ensureDir, readJSON, writeJSON } from 'fs-extra'

const opts = <Options>{
  filter: filePath => extname(filePath) === ".json",
}

const dataDirPath = join(__dirname, '../data')
const filePath = join(dataDirPath, '/deployed.json')
const contractsPath = join(__dirname, "../ethereum/build/contracts/")

type json = {[k :string]: json[]|json|string|number|boolean|null}
type jsonList = json[]

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
        const items:jsonList = await Promise.all(reads)
        const filtered = items
          .filter(contract => contract.contractName !== 'Migrations'   // filter out Truffle migration tracking
            && contract.networks
            && contract.networks[networkId]
            && Object.keys(contract.networks[networkId]).length > 0)

        resolve(filtered)
      })
  })
}

export type savedContract = {
  address: string
  contractName: string
  created: string
  created_note: string
}

export async function addDeployedContract (name:string, address: string, msg?:string) {
  const table = await getDeployedContracts2()
  table.push(<savedContract>{
    address: address,
    contractName: name,
    created: new Date().toJSON(),
    created_note: msg,
  })
  await writeJSON(filePath,table,{
    spaces: 2 // JSON formatting
  })
}


export async function getDeployedContracts2 ():Promise<savedContract[]> {
  try {
    await ensureDir(dataDirPath)
    let table:savedContract[] = await readJSON(filePath)
    return table
  }
  catch (e) {
  }
  return []
}
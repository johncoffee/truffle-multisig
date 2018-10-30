import { extname, join } from 'path'
import { Item, Options } from 'klaw'
import * as klaw from 'klaw'
import { ensureDir, readJSON } from 'fs-extra'

const opts = <Options>{
  filter: filePath => extname(filePath) === ".json",
}

const contractsPath = join(__dirname, "../ethereum/build/contracts/")

type json = {[k :string]: any}

export async function getContracts():Promise<json[]> {
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
        resolve(items)
      })
  })
}

if (!module.parent) {
  getContracts().then(res => console.log(res.map(item => item.networks)))
}

import { shorten } from '../visual-helpers.js'
import chalk from 'chalk'
import { join } from 'path'
const Web3 = require('web3')

const {yellow, red, blue, greenBright} = chalk

export async function info (contractAddress:string, networkId:string) {
  console.log(`CONTRACT STATE INFORMATION`)
  console.log('')

  const web3 = new Web3('http://localhost:7545')
  await recursiveWalk(contractAddress, web3,`Contract`)
    .catch(err => console.error(red(err)))
}

enum StateNames {
  draft = 1,
  active = 2,
  terminated = 3,
}

const stateColours = new Map<StateNames, Function>()
stateColours.set(StateNames.draft, yellow)
stateColours.set(StateNames.active, greenBright)
stateColours.set(StateNames.terminated, blue)

const colour = (state:number) => {
  const func = stateColours.get(state)
  if (func)
    return func(StateNames[state])
  else return StateNames[state]
}

async function recursiveWalk(address:string, web3:any, displayName:string, level:number = 0):Promise<any> {
  if (address === '0x0000000000000000000000000000000000000000') return Promise.reject('address was 0x')

  const instance = new web3.eth.Contract(require( join(__dirname, '../../ethereum/build/contracts/ICommonState.json')).abi, address)

  const [contractState, numSubContracts] = await Promise.all([
    <Promise<StateNames>>instance.methods.getState().call(),
    <Promise<number>>instance.methods.countSubcontracts().call(),
  ])

  console.log(`${displayName} (at ${shorten(address)}) is ${colour(parseInt(contractState.toString(), 10))}, has ${numSubContracts} subcontracts`)

  for (let i = 0; i < numSubContracts; i++) {
    const subContractAddress = await <Promise<string>>instance.methods.getSubcontract(i.toString()).call()
    await recursiveWalk(subContractAddress, web3, `${' '.repeat(2+level*2)}- subcontract`, level+1)
  }
}

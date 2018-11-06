import minimist = require('minimist')
import chalk from 'chalk'
import { validate } from './validate-input.js'
import { createSig, retrieveKeystore, txObj } from './sigTools.js'
import { keystore } from 'eth-lightwallet'
import * as lightwallet from 'eth-lightwallet'
import { getDeployedContracts } from './files.js'
import { shorten } from './visual-helpers.js'
import { create } from './methods/create.js'
const Web3 = require('web3')

const txutils = (lightwallet as any).txutils // type washing
console.assert(txutils, 'lightwallet.txutils should be a thing');

const {yellow, red, blue, greenBright} = chalk

const argv = minimist(process.argv.slice(2), {
  string: [
    'a', 'address',
    'm', 'multisig',
    'd', 'dest',
    'sp', 's',
    'from', 'f'
  ], // always treat these as strings
})
if (argv.v) {
  console.debug(argv)
}

enum Cmd {
  help,
  info,
  add,
  list, ls,
  expenses, xp,
  register, sp,
  create, mk,
  deploy,
  sign,
  tx,
}

const subcommand:Cmd = Cmd[argv._[0]] as any || Cmd.help

// assertions
validate(Cmd[subcommand],argv)


async function Help() {
  const cmdTpl = '$ node/cli.js'
  console.log('USAGE')
  console.log(`  ${cmdTpl} [-v] <command>`)
  console.log('')
  console.log('COMMANDS')
  console.log('  '+ Object.keys(Cmd)
    .filter(v => v.toString().length > 2 || v === "tx")
    .filter(v => /^\d+$/.test(v) === false)
    .sort()
    .join(', ')
  )
  console.log('')
  console.log('FLAGS')
  console.log('  use -v to show debug output')
}

async function register () {
  const newSeed = keystore.generateRandomSeed()
  const [ks, keyFromPw] = await retrieveKeystore(newSeed, '')

  ks.generateNewAddress(keyFromPw, 1)
  const [signingAddr] = ks.getAddresses()
  console.log("Address: "+signingAddr)
  console.log("Seed:    "+newSeed)

}
async function tx () {
  const sig1 = JSON.parse(argv._[1]) // {"sigV":28,"sigR":"0x7d223c507acf17887340f364f7cf910ec54dfb2f10e08ce5ddc3d60bf9b221b3","sigS":"0x1bdd9f4ba9afd5466b59010746caf55dd396769a1c8a8c001e3ee693276af1d3"}
  const sig2 = JSON.parse(argv._[2]) // {"sigV":28,"sigR":"0x7d223c507acf17887340f364f7cf910ec54dfb2f10e08ce5ddc3d60bf9b221b3","sigS":"0x1bdd9f4ba9afd5466b59010746caf55dd396769a1c8a8c001e3ee693276af1d3"}

  const sigsOrdered:txObj[] = [sig1, sig2] // .sort() // should have been sorted based on sender address
  // validate all input
  sigsOrdered.forEach(sig1 => console.assert(sig1.sigV && sig1.sigR && sig1.sigS, "missing V, R or S", sig1))

  const sigs = {
    sigV: sigsOrdered.map(sig => sig.sigV),
    sigR: sigsOrdered.map(sig => sig.sigR),
    sigS: sigsOrdered.map(sig => sig.sigS),
  }

  const destAddress     = argv.d || argv.dest     || require('../ethereum/build/contracts/SimpleContract.json').networks['1337'].address // demo stuff
  const multisigAddress = argv.m || argv.multisig || require('../ethereum/build/contracts/SimpleMultiSig.json').networks['1337'].address // dev stuff

  console.assert(destAddress, "did not find dest address")
  console.assert(multisigAddress, "did not find MultiSig address")

  const web3 = new Web3('http://localhost:7545')
  const multisigInstance:any = new web3.eth.Contract(require('../ethereum/build/contracts/SimpleMultiSig').abi,
    multisigAddress,
    {
      from: argv.from || argv.f,
    })

  // Web3 use call because we just reading
  multisigInstance.methods.nonce().call().then(async nonce => {
    const data = txutils._encodeFunctionTxData('nextState', [], []);// sending data doesn't work https://github.com/ethereum/solidity/issues/2884

    console.log('nonce ' + nonce);
    // send transaction here, not using .call!
    await multisigInstance.methods.execute(sigs.sigV, sigs.sigR, sigs.sigS, destAddress, nonce, data).send()
  })
}

async function sign () {
  const seedPhrase = argv.s || argv.seed
  const password = argv.p || argv.password || ''
  const multisigAddr = argv.m || argv.multisig || require('../ethereum/build/contracts/SimpleMultiSig.json').networks['1337'].address // dev stuff

  const web3 = new Web3('http://localhost:7545')
  const multisigInstance = new web3.eth.Contract(require('../ethereum/build/contracts/SimpleMultiSig').abi,
    multisigAddr,
    {
      from: argv.from || argv.f,
    })

  multisigInstance.methods.nonce().call().then(async nonce => {
    const destAddr = argv.d || argv.dest || require('../ethereum/build/contracts/SimpleContract.json').networks['1337'].address // demo stuff

    const [ks, keyFromPw] = await retrieveKeystore(seedPhrase, password)
    ks.generateNewAddress(keyFromPw, 1)
    const [signingAddr] = ks.getAddresses()
    let s:txObj
    try {
      s = createSig(ks, signingAddr, keyFromPw, multisigAddr, nonce, 'nextState', destAddr)
      console.log('Signature:')
      console.log(JSON.stringify(s))
    }
    catch (e) {
      console.error(red(e.toString()))
      console.error(e)
    }

  })
}

async function info () {
  const networkId = argv.networkId || '1337'
  const contractAddress:string = argv.a || argv.address || require('../ethereum/build/contracts/Sp1.json').networks[networkId].address
  // console.assert(contractAddress)

  console.log(`CONTRACT STATE INFORMATION`)
  console.log()

  const web3 = new Web3('http://localhost:7545')
  await recursiveWalk(contractAddress, web3,`Contract`)
    .catch(err => console.error(red(err)))


  console.log('')
  console.log('OPTIONS')
  console.log(`  - transition contract to active using $ node cli.js 'sign'`)
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

  const instance = new web3.eth.Contract(require('../ethereum/build/contracts/ICommonState.json').abi, address)

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

async function add () {
  // const mainContractAddress:string = argv.a || argv.address
  const subcontractAddress:string = argv.s || argv.subcontract
  // console.assert(mainContractAddress)
  const networkId = argv.networkId || '1337'
  console.assert(networkId)
  console.assert(subcontractAddress)
  console.assert(argv.from || argv.f)

  const web3 = new Web3('http://localhost:7545')
  const instance:any = new web3.eth.Contract(require('../ethereum/build/contracts/Sp1.json').abi,
    require('../ethereum/build/contracts/Sp1.json').networks[networkId].address,
    {})

  instance.methods.add(subcontractAddress)
    .send({
      from: argv.from || argv.f,
    })
    .then(() => {
      instance.methods.subcontract().call().then(val => {
        console.assert(val.toString().toLowerCase() === subcontractAddress.toLowerCase(), "Was not set correct "+red(val))
      })
    })
}


// router

interface Handler {
  () : Promise<void>
}
const handlers = new Map<Cmd, Handler>()

handlers.set(Cmd.info, info)
handlers.set(Cmd.add, add)
handlers.set(Cmd.tx, tx)
handlers.set(Cmd.help, Help)
handlers.set(Cmd.sign, sign)

handlers.set(Cmd.register, register)
handlers.set(Cmd.sp, register)

handlers.set(Cmd.expenses, async () => {
  console.log("Expense report")
  console.log("")
  console.log("  Contract 0x12...Qm has 4 recorded expenses")
  console.log("    20   kaffe               0x33..mq")
  console.log("    44   kaffe               0xf2..ef")
  console.log("    750  DSB kontrol afgift  0xaf..01")
  console.log("    22,5 kaffe               0x09..0a")
})
handlers.set(Cmd.xp, handlers.get(Cmd.expenses) as Handler)


handlers.set(Cmd.list, async () => {
  const networkId = argv.networkId || '1337'
  const allContracts = await getDeployedContracts(networkId)

  console.log(`CONTRACTS OVERVIEW (network ${networkId})`)
  console.log("")
  allContracts
    .map(contract => ({
      name: `  ${contract.contractName}`,
      address: `    ${contract.networks[networkId].address}`,
    }) )
    .forEach(vm => Object.values(vm).forEach(val => console.log(val) ))
})

handlers.set(Cmd.ls, handlers.get(Cmd.list) as Handler)


handlers.set(Cmd.create, async () => create(argv.f || argv.from, argv.sp || argv.s, argv.n || argv.name))

handlers.set(Cmd.mk, handlers.get(Cmd.create) as Handler)

const handler = handlers.get(subcommand as any) || handlers.get(Cmd.help) as Handler
console.assert(handler, "should have found handler")
handler()

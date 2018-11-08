import minimist = require('minimist')
import chalk from 'chalk'
import { callNextStateMultiSig, createSig, retrieveKeystore, txObj } from './sigTools.js'
import { keystore } from 'eth-lightwallet'
import { addDeployedContract, getDeployedContracts, getDeployedContracts2, savedContract } from './files.js'
import { create } from './methods/create.js'
import { info } from './methods/info.js'
import { ParsedArgs } from 'minimist'
const Web3 = require('web3')

const {yellow, red, blue, greenBright} = chalk

const argv = minimist(process.argv.slice(2), {
  string: [
    '_',
    'a', 'address',
    'm', 'multisig',
    'd', 'dest',
    'sp', 's',
    'from', 'f'
  ], // always treat these as strings
})
// console.debug(argv)

enum Cmd {
  help,
  info,
  add,
  list, ls,
  register, sp,
  create, mk,
  deploy,
  sign,
  tx,
}

const subcommand:Cmd = Cmd[argv._[0]] as any || Cmd.help



async function Help() {
  console.log('USAGE')
  console.log(`  node cli.js <subcommand>`)
  console.log('')
  console.log('SUBCOMMANDS')
  console.log('  '+ Object.keys(Cmd)
    .filter(v => v.toString().length > 2 || v === "tx")
    .filter(v => /^\d+$/.test(v) === false)
    .sort()
    .join(', ')
  )
  console.log('')
  console.log("Try 'node cli.js <subcommand> -h' to learn more about each command")
}

async function register () {
  if (argv.h) {
    console.log("USAGE")
    console.log("  register")
    return
  }

  const newSeed = keystore.generateRandomSeed()
  const [ks, keyFromPw] = await retrieveKeystore(newSeed, '')

  ks.generateNewAddress(keyFromPw, 1)
  const [signingAddr] = ks.getAddresses()
  console.log("Address: "+signingAddr)
  console.log("Seed:    "+newSeed)
}

async function tx () {
  if (subcommandNoArgs(argv)) {
    console.log("USAGE")
    console.log("  tx <sig1> <sig2>")
    console.log("")
    console.log("ARGUMENTS")
    console.log("  two serialized signatures")
    console.log("")
    console.log("OPTIONS")
    console.log("  --from, -f from address")
    console.log("  --multisig, -m multisigAddress address")
    console.log("  --dest, -d destAddress address")
    return
  }

  const destAddress     = argv.d || argv.dest     || require('../ethereum/build/contracts/SimpleContract.json').networks['1337'].address // demo stuff
  const multisigAddress = argv.m || argv.multisig || require('../ethereum/build/contracts/SimpleMultiSig.json').networks['1337'].address // dev stuff
  const from = argv.from || argv.f

  console.assert(destAddress, "did not find dest address")
  console.assert(multisigAddress, "did not find MultiSig address")
  console.assert(from, "did not get from")

  const sig1 = JSON.parse(argv._[1]) // {"sigV":28,"sigR":"0x7d223c507acf17887340f364f7cf910ec54dfb2f10e08ce5ddc3d60bf9b221b3","sigS":"0x1bdd9f4ba9afd5466b59010746caf55dd396769a1c8a8c001e3ee693276af1d3"}
  const sig2 = JSON.parse(argv._[2]) // {"sigV":28,"sigR":"0x7d223c507acf17887340f364f7cf910ec54dfb2f10e08ce5ddc3d60bf9b221b3","sigS":"0x1bdd9f4ba9afd5466b59010746caf55dd396769a1c8a8c001e3ee693276af1d3"}

  // validate all input
  new Array(sig1, sig2)
    .forEach((sig, index) => console.assert(sig.sigV && sig.sigR && sig.sigS, index +": missing V, R or S", sig))

  callNextStateMultiSig(sig1, sig2, destAddress, multisigAddress, from)
}

async function sign () {
  if (subcommandNoArgs(argv)) {
    console.log("USAGE")
    console.log("  sign -s 0x123 -m 0x234 -d 0x345 -f 0x456")
    console.log("")
    console.log("OPTIONS")
    console.log("  --dest, -d address of the business contract")
    console.log("  --multisig, -m address of the multisig contract")
    console.log("  --seed, -s seed words to signing HD wallet")
    console.log("  --from, -f transaction from address")
    return
  }

  const seedPhrase = argv.s || argv.seed
  const password = argv.p || argv.password || ''
  const multisigAddr = argv.m || argv.multisig || require('../ethereum/build/contracts/SimpleMultiSig.json').networks['1337'].address // dev stuff

  console.assert(seedPhrase, "need seedPhrase")
  console.assert(multisigAddr, "need multisigAddr")
  console.assert(!!password || password === '', "need password")

  const web3 = new Web3('http://localhost:7545')
  const multisigInstance = new web3.eth.Contract(require('../ethereum/build/contracts/SimpleMultiSig').abi,
    multisigAddr,
    {
      from: argv.from || argv.f,
    })

  multisigInstance.methods.nonce().call().then(async nonce => {
    const destAddr = argv.d || argv.dest || require('../ethereum/build/contracts/SimpleContract.json').networks['1337'].address // demo stuff
    console.assert(destAddr, 'missing dest address')

    const [ks, keyFromPw] = await retrieveKeystore(seedPhrase, password)
    ks.generateNewAddress(keyFromPw, 1)
    const [signingAddr] = ks.getAddresses()
    let s:txObj
    try {
      s = createSig(ks, signingAddr, keyFromPw, multisigAddr, nonce, 'nextState', destAddr) // TODO dont hardcode method
      console.log('Signature:')
      console.log(JSON.stringify(s))
    }
    catch (e) {
      console.error(red(e.toString()))
      console.error(e)
    }

  })
}

async function add () {
  if (subcommandNoArgs(argv)) {
    console.log("USAGE")
    console.log("  add -s 0x123 -a 0x456")
    console.log("")
    console.log("OPTIONS")
    console.log("  -a the address of the main contract")
    console.log("  --subcontract, -s the address of the subcontract to be added")

    return
  }
  // const mainContractAddress:string = argv.a || argv.address
  const subcontractAddress:string = argv.s || argv.subcontract
  // console.assert(mainContractAddress)
  const networkId = argv.networkId || '1337'
  console.assert(networkId)
  console.assert(subcontractAddress)
  console.assert(argv.a)
  console.assert(argv.from || argv.f)

  const web3 = new Web3('http://localhost:7545')
  const instance:any = new web3.eth.Contract(require('../ethereum/build/contracts/Sp1.json').abi,
    argv.a,
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


function subcommandNoArgs(argv:ParsedArgs):boolean {
  return (argv.h || argv._.length === 1)
}

// router

interface Handler {
  () : Promise<void>
}
const handlers = new Map<Cmd, Handler>()

handlers.set(Cmd.info, async() => {
  const networkId = argv.networkId || '1337'
  const contractAddress:string = argv.a || argv.address || require('../ethereum/build/contracts/Sp1.json').networks[networkId].address
  info(contractAddress, networkId)
})
handlers.set(Cmd.add, add)
handlers.set(Cmd.tx, tx)
handlers.set(Cmd.help, Help)
handlers.set(Cmd.sign, sign)

handlers.set(Cmd.register, register)
handlers.set(Cmd.sp, handlers.get(Cmd.register) as Handler)

handlers.set(Cmd.list, async () => {
  if (argv.h) {
    console.log("USAGE")
    console.log("  node cli.js list")
    return
  }

  const networkId = argv.networkId || '1337'
  const allContracts:savedContract[] = await getDeployedContracts2()

  console.log(`CONTRACTS OVERVIEW`)
  console.log("")
  allContracts
    .map(contract => ({
      name: `  ${contract.contractName}`,
      address: `    ${contract.address}`,
    }) )
    .forEach(vm => Object.values(vm).forEach(val => console.log(val) ))
})
handlers.set(Cmd.ls, handlers.get(Cmd.list) as Handler)


handlers.set(Cmd.create, async () => {
  if (subcommandNoArgs(argv)) {
    console.log("USAGE")
    console.log(`  node.cli create --from 0x123 <contract name> <constructor arguments>`)
    console.log(``)
    console.log(`OPTIONS`)
    console.log(`  --from, -f is the sender address`)
    return
  }

  const from = argv.f || argv.from
  console.assert(from, "'create needs --from, -f")

  const tpl = argv._[1]
  console.assert(tpl, "Need a template name")
  const constructorArgs = argv._.slice(2)

  console.debug(tpl, constructorArgs)

  console.info("Creating: ", tpl)
  console.info("Passing: ", constructorArgs.map(val => `'${val}'`).join(', '))

  const contract = await create(constructorArgs, tpl, from)
  if (!argv.n) {
    await addDeployedContract(tpl, contract.options.address)
  }
})

handlers.set(Cmd.mk, handlers.get(Cmd.create) as Handler)

const handler = handlers.get(subcommand as any) || handlers.get(Cmd.help) as Handler
console.assert(handler, "should have found handler")
handler()

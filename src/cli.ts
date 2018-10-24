import minimist = require('minimist')
import chalk from 'chalk'
import { validate } from './validate-input.js'
import { createSig, retrieveKeystore } from './sigTools.js'
import { keystore } from 'eth-lightwallet'
import * as lightwallet from 'eth-lightwallet'
import {BigNumber} from 'bignumber.js'
import { Web3 as Web3Class } from 'web3x'
import { ContractAbi } from 'web3x/contract'
const Web3 = require('web3')

const txutils = (lightwallet as any).txutils // type washing
console.assert(txutils, 'lightwallet.txutils should be a thing');

const {yellow, red, blue, greenBright} = chalk

const argv = minimist(process.argv.slice(2), {
  string: ['m', 'multisig', 'd', 'dest', 'from'] // always treat these as strings
})
if (argv.v) {
  console.debug(argv)
}

enum Cmd {
  help,
  list, ls,
  expenses, xp,
  register, sp,
  create, mk,
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
  console.log('  list, sign, create')
  console.log('')
  console.log('FLAGS')
  console.log('  use -v to show debug output')
}

async function register () {
  console.log("Registering '" + argv.name + "' as Service Provider ...")

  const newSeed = keystore.generateRandomSeed()
  retrieveKeystore(newSeed, '')
    .then(([ks, keyFromPw]) => {
      ks.generateNewAddress(keyFromPw, 1)
      const [signingAddr] = ks.getAddresses()
      console.log("Address: "+signingAddr)
      console.log("Seed:    "+newSeed)
    })

}
async function tx () {
  const sig1 = JSON.parse(argv._[1]) // {"sigV":28,"sigR":"0x7d223c507acf17887340f364f7cf910ec54dfb2f10e08ce5ddc3d60bf9b221b3","sigS":"0x1bdd9f4ba9afd5466b59010746caf55dd396769a1c8a8c001e3ee693276af1d3"}
  const sig2 = JSON.parse(argv._[2]) // {"sigV":28,"sigR":"0x7d223c507acf17887340f364f7cf910ec54dfb2f10e08ce5ddc3d60bf9b221b3","sigS":"0x1bdd9f4ba9afd5466b59010746caf55dd396769a1c8a8c001e3ee693276af1d3"}

  const sigsOrdered:any = [sig1, sig2] // .sort() // should have been sorted based on sender address
  const sigs = {
    sigV: sigsOrdered.map(sig => sig.sigV),
    sigR: sigsOrdered.map(sig => sig.sigR),
    sigS: sigsOrdered.map(sig => sig.sigS),
  }
  console.assert(sigs.sigV[0], "missing a V", sigs)
  console.assert(sigs.sigS[1], "missing a S")

  const destAddr2     = argv.d || argv.dest     || require('../ethereum/build/contracts/TestContract1.json').networks['1337'].address // demo stuff
  const multisigAddr2 = argv.m || argv.multisig || require('../ethereum/build/contracts/SimpleMultiSig.json').networks['1337'].address // dev stuff

  const web3 = new Web3('http://localhost:7545') as Web3Class
  const multisigInstance:any = new web3.eth.Contract(require('../ethereum/build/contracts/SimpleMultiSig').abi as ContractAbi,
    multisigAddr2,
    {
      from: '0x2153f712f208b8698312cd2737525aefa2de7bb9',
    })

  // Web3 use call because we just reading
  multisigInstance.methods.nonce().call().then(async nonce => {
    const data = txutils._encodeFunctionTxData('nextState', [], []);// sending data doesn't work https://github.com/ethereum/solidity/issues/2884

    console.log('nonce ' + nonce);
    // send transaction here, not using .call!
    const res = await multisigInstance.methods.execute(sigs.sigV, sigs.sigR, sigs.sigS, destAddr2, nonce, data).send()
  })
}

async function sign () {
  const seedPhrase = argv.s || argv.seed
  const password = argv.p || argv.password || ''

  const nonce:number = [argv.n, argv.nonce].find(val => val !== undefined)
  console.assert(nonce != undefined, "should have nonce")

  const multisigAddr = argv.m || argv.multisig || require('../ethereum/build/contracts/SimpleMultiSig.json').networks['1337'].address // dev stuff
  const destAddr = argv.d || argv.dest || require('../ethereum/build/contracts/TestContract1.json').networks['1337'].address // demo stuff

  retrieveKeystore(seedPhrase, password)
    .then(([ks, keyFromPw]) => {
      ks.generateNewAddress(keyFromPw, 1)
      const [signingAddr] = ks.getAddresses()
      let s
      try {
        s = createSig(ks,signingAddr, keyFromPw, multisigAddr, nonce, destAddr)
      }
      catch (e) {
        console.error(red(e.toString()))
        console.error(e)
      }
      if (s) {
        console.log("Signature:")
        console.log(JSON.stringify(s))
      }
    }, err => console.error)
    .catch(err => console.error)
}


// router

interface Handler {
  () : Promise<void>
}
const handlers = new Map<Cmd, Handler>()

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
  const cmdTpl = '$ node/cli.js'

  console.log(`${greenBright('Active')} contracts:`)
  console.log("  TestContract1 ")
  console.log("    0xe0f617ab0d5baec7ca441d6840a7fd16d4051550")
  console.log("  TestContract2 ")
  console.log("    0x7254747f127cc447808aaffb5910d963e1a92688")
  console.log()
  console.log(`${blue('Drafts')}, ready to be signed and activated:`)
  console.log(" - Test3")
  console.log('')
  console.log(blue(`Proceed by ${cmdTpl} sign <contract id>`))
  console.log('')

})
handlers.set(Cmd.ls, handlers.get(Cmd.list) as Handler)

handlers.set(Cmd.create, async () => {
  const createName = argv._[1] || argv.name
  // const s1 = keystore.generateRandomSeed()
  // const s2 = keystore.generateRandomSeed()
  console.log(`Creating contract '${argv.n}'`)
  console.log(`from source '${createName}'`)
  // console.debug(s1)
  // console.debug(s2)
  console.log("Deploying...")
  console.log("Mined at block 30120312 tx hash 0xa8DBBB00d88e88s88f88ge9d")
  console.log("Done.")
})
handlers.set(Cmd.mk, handlers.get(Cmd.create) as Handler)

const handler = handlers.get(subcommand as any) || handlers.get(Cmd.help) as Handler
console.assert(handler, "should have found handler")
handler()

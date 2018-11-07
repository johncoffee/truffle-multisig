import { keystore, signing } from 'eth-lightwallet'
const solsha3 = require('solidity-sha3').default
const leftPad = require('left-pad')
import {BigNumber} from 'bignumber.js'
import * as lightwallet from 'eth-lightwallet'

const Web3 = require('web3')

const txutils = (lightwallet as any).txutils // type washing
console.assert(txutils, 'lightwallet.txutils should be a thing');

// keystore
export type txObj = {sigV: number, sigR: string, sigS: string}

export function retrieveKeystore (seedPhrase:string, password:string = ''):Promise<[keystore, Uint8Array]> {
  return new Promise(resolve => {
    keystore.createVault({
      hdPathString: "m/44'/60'/0'/0",
      seedPhrase, password,
    }, (err, ks) => {
      if (err) throw err

      ks.keyFromPassword(password, function (err, keyFromPw) {
        resolve(<[keystore, Uint8Array]>[ks, keyFromPw])
      })
    })
  })
}

export function createSig (ks:keystore, signingAddr:string, keyFromPw:Uint8Array, multisigContractAddr:string, nonce:number, destinationMethod:string, destinationAddr:string, destinationValue:number = 0):txObj {
  const nonceBn:BigNumber = new BigNumber(nonce, 10) // typeguard
  const valueBn:BigNumber = new BigNumber(destinationValue, 10) // typeguard
  console.assert(multisigContractAddr.substr(0,2) === "0x", "multisigAddr should be in hex format",multisigContractAddr)
  console.assert(destinationAddr.substr(0,2) === "0x", "destinationAddr should be in hex format",destinationAddr)

  const data = txutils._encodeFunctionTxData(destinationMethod, [], []);// sending data doesn't work https://github.com/ethereum/solidity/issues/2884

  let input = '0x19' + '00'
    + multisigContractAddr.slice(2)
    + destinationAddr.slice(2)
    + leftPad(valueBn.toString(16), '64', '0')
    + data.slice(2)
    + leftPad(nonceBn.toString(16), '64', '0') // toString(16) is type strong

  let hash = solsha3(input)

  let sig = signing
    .signMsgHash(ks, keyFromPw, hash,
      signingAddr)

  let sigV = sig.v
  let sigR = '0x' + sig.r.toString('hex')
  let sigS = '0x' + sig.s.toString('hex')

  return <txObj>{sigV: sigV, sigR: sigR, sigS: sigS}
}

export function callNextStateMultiSig (sig1:txObj, sig2:txObj, destAddress:string, multisigAddress:string, from:string) {
  const sigsOrdered:txObj[] = [sig1, sig2] // .sort() // should have been sorted based on sender address
  // validate all input
  sigsOrdered.forEach(sig1 => console.assert(sig1.sigV && sig1.sigR && sig1.sigS, "missing V, R or S", sig1))

  const sigs = {
    sigV: sigsOrdered.map(sig => sig.sigV),
    sigR: sigsOrdered.map(sig => sig.sigR),
    sigS: sigsOrdered.map(sig => sig.sigS),
  }

  const web3 = new Web3('http://localhost:7545')
  const multisigInstance:any = new web3.eth.Contract(require('../ethereum/build/contracts/SimpleMultiSig').abi,
    multisigAddress,
    {
      from: from,
    })

  // Web3 use call because we just reading
  multisigInstance.methods.nonce().call().then(async nonce => {
    const data = txutils._encodeFunctionTxData('nextState', [], []);// sending data doesn't work https://github.com/ethereum/solidity/issues/2884

    console.log('nonce ' + nonce);
    // send transaction here, not using .call!
    await multisigInstance.methods.execute(sigs.sigV, sigs.sigR, sigs.sigS, destAddress, nonce, data).send()
  })
}

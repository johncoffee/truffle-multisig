import { keystore, signing } from 'eth-lightwallet'
const solsha3 = require('solidity-sha3').default
const leftPad = require('left-pad')
import {BigNumber} from 'bignumber.js'
import * as lightwallet from 'eth-lightwallet'
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

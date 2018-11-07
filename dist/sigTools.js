"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eth_lightwallet_1 = require("eth-lightwallet");
const solsha3 = require('solidity-sha3').default;
const leftPad = require('left-pad');
const bignumber_js_1 = require("bignumber.js");
const lightwallet = require("eth-lightwallet");
const Web3 = require('web3');
const txutils = lightwallet.txutils; // type washing
console.assert(txutils, 'lightwallet.txutils should be a thing');
function retrieveKeystore(seedPhrase, password = '') {
    return new Promise(resolve => {
        eth_lightwallet_1.keystore.createVault({
            hdPathString: "m/44'/60'/0'/0",
            seedPhrase, password,
        }, (err, ks) => {
            if (err)
                throw err;
            ks.keyFromPassword(password, function (err, keyFromPw) {
                resolve([ks, keyFromPw]);
            });
        });
    });
}
exports.retrieveKeystore = retrieveKeystore;
function createSig(ks, signingAddr, keyFromPw, multisigContractAddr, nonce, destinationMethod, destinationAddr, destinationValue = 0) {
    const nonceBn = new bignumber_js_1.BigNumber(nonce, 10); // typeguard
    const valueBn = new bignumber_js_1.BigNumber(destinationValue, 10); // typeguard
    console.assert(multisigContractAddr.substr(0, 2) === "0x", "multisigAddr should be in hex format", multisigContractAddr);
    console.assert(destinationAddr.substr(0, 2) === "0x", "destinationAddr should be in hex format", destinationAddr);
    const data = txutils._encodeFunctionTxData(destinationMethod, [], []); // sending data doesn't work https://github.com/ethereum/solidity/issues/2884
    let input = '0x19' + '00'
        + multisigContractAddr.slice(2)
        + destinationAddr.slice(2)
        + leftPad(valueBn.toString(16), '64', '0')
        + data.slice(2)
        + leftPad(nonceBn.toString(16), '64', '0'); // toString(16) is type strong
    let hash = solsha3(input);
    let sig = eth_lightwallet_1.signing
        .signMsgHash(ks, keyFromPw, hash, signingAddr);
    let sigV = sig.v;
    let sigR = '0x' + sig.r.toString('hex');
    let sigS = '0x' + sig.s.toString('hex');
    return { sigV: sigV, sigR: sigR, sigS: sigS };
}
exports.createSig = createSig;
function callNextStateMultiSig(sig1, sig2, destAddress, multisigAddress, from) {
    const sigsOrdered = [sig1, sig2]; // .sort() // should have been sorted based on sender address
    // validate all input
    sigsOrdered.forEach(sig1 => console.assert(sig1.sigV && sig1.sigR && sig1.sigS, "missing V, R or S", sig1));
    const sigs = {
        sigV: sigsOrdered.map(sig => sig.sigV),
        sigR: sigsOrdered.map(sig => sig.sigR),
        sigS: sigsOrdered.map(sig => sig.sigS),
    };
    const web3 = new Web3('http://localhost:7545');
    const multisigInstance = new web3.eth.Contract(require('../ethereum/build/contracts/SimpleMultiSig').abi, multisigAddress, {
        from: from,
    });
    // Web3 use call because we just reading
    multisigInstance.methods.nonce().call().then(async (nonce) => {
        const data = txutils._encodeFunctionTxData('nextState', [], []); // sending data doesn't work https://github.com/ethereum/solidity/issues/2884
        console.log('nonce ' + nonce);
        // send transaction here, not using .call!
        await multisigInstance.methods.execute(sigs.sigV, sigs.sigR, sigs.sigS, destAddress, nonce, data).send();
    });
}
exports.callNextStateMultiSig = callNextStateMultiSig;

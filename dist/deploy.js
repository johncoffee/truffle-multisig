"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
async function deploy(from, web3) {
    const artifact = require(path_1.join(__dirname, '../ethereum/build/contracts/SimpleContract.json'));
    const multisigInstance = new web3.eth.Contract(artifact.abi);
    const instance = await multisigInstance
        .deploy({
        data: artifact.bytecode,
        arguments: [from],
    })
        .send({
        from: from,
        gas: 1000000,
    });
    return instance;
}
exports.deploy = deploy;

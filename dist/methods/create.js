"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const Web3 = require('web3');
async function create(from, serviceProvider, template) {
    const web3 = new Web3('http://localhost:7545');
    const artifact = require(path_1.join(__dirname, `../../ethereum/build/contracts/${template}.json`));
    const metaInstance = new web3.eth.Contract(artifact.abi);
    const deployed = await metaInstance
        .deploy({
        data: artifact.bytecode,
        arguments: [from, serviceProvider],
    })
        .send({
        from: from,
        gas: 1000000,
    });
    // console.debug(Object.keys(deployed.methods))
    console.log(`Deployed to ${deployed.options.address}`);
    return deployed;
}
exports.create = create;

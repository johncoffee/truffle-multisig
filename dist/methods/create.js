"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const chalk_1 = require("chalk");
const Web3 = require('web3');
const { greenBright } = chalk_1.default;
async function create(template, from, constructorArguments = []) {
    constructorArguments.forEach(val => {
        console.assert(val !== undefined, "can't pass undefined to constructor");
        console.assert(val !== null, "can't pass null to constructor");
    });
    const web3 = new Web3('http://localhost:7545');
    const artifact = require(path_1.join(__dirname, `../../ethereum/build/contracts/${template}.json`));
    console.assert(artifact.bytecode && artifact.bytecode !== "0x", `Something is off with the byte code: ` + artifact.bytecode);
    const metaInstance = new web3.eth.Contract(artifact.abi);
    const deployed = await metaInstance
        .deploy({
        data: artifact.bytecode,
        arguments: constructorArguments,
    })
        .send({
        from: from,
        gas: 2000000,
    });
    console.info(`  deployed to ${greenBright(deployed.options.address)}`);
    return deployed;
}
exports.create = create;

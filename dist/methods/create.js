"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
async function create(from, serviceProvider, name, web3) {
    const artifact = require(path_1.join(__dirname, `../../ethereum/build/contracts/${name}.json`));
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

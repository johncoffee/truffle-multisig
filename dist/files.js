"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const klaw = require("klaw");
const fs_extra_1 = require("fs-extra");
const opts = {
    filter: filePath => path_1.extname(filePath) === ".json",
};
const contractsPath = path_1.join(__dirname, "../ethereum/build/contracts/");
async function getDeployedContracts(networkId) {
    return new Promise(resolve => {
        const reads = [];
        klaw(contractsPath, opts)
            .on('data', item => {
            if (!item.stats.isDirectory()) {
                reads.push(fs_extra_1.readJSON(item.path));
            }
        })
            .on('end', async () => {
            const items = await Promise.all(reads);
            const filtered = items
                .filter(contract => contract.contractName !== 'Migrations' // filter out Truffle migration tracking
                && contract.networks[networkId]
                && Object.keys(contract.networks[networkId]).length > 0);
            resolve(filtered);
        });
    });
}
exports.getDeployedContracts = getDeployedContracts;

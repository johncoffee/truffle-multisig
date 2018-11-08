"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const klaw = require("klaw");
const fs_extra_1 = require("fs-extra");
const opts = {
    filter: filePath => path_1.extname(filePath) === ".json",
};
const dataDirPath = path_1.join(__dirname, '../data');
const filePath = path_1.join(dataDirPath, '/deployed.json');
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
                && contract.networks
                && contract.networks[networkId]
                && Object.keys(contract.networks[networkId]).length > 0);
            resolve(filtered);
        });
    });
}
exports.getDeployedContracts = getDeployedContracts;
async function addDeployedContract(name, address) {
    const table = await getDeployedContracts2();
    table.push({
        address: address,
        contractName: name,
        created: new Date().toJSON(),
    });
    await fs_extra_1.writeJSON(filePath, table, {
        spaces: 2 // JSON formatting
    });
}
exports.addDeployedContract = addDeployedContract;
async function getDeployedContracts2() {
    try {
        await fs_extra_1.ensureDir(dataDirPath);
        let table = await fs_extra_1.readJSON(filePath);
        return table;
    }
    catch (e) {
    }
    return [];
}
exports.getDeployedContracts2 = getDeployedContracts2;

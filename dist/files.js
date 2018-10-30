"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const klaw = require("klaw");
const fs_extra_1 = require("fs-extra");
const opts = {
    filter: filePath => path_1.extname(filePath) === ".json",
};
const contractsPath = path_1.join(__dirname, "../ethereum/build/contracts/");
async function getContracts() {
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
            resolve(items);
        });
    });
}
exports.getContracts = getContracts;
if (!module.parent) {
    getContracts().then(res => console.log(res.map(item => item.networks)));
}

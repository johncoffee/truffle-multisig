"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minimist = require("minimist");
const chalk_1 = require("chalk");
const sigTools_js_1 = require("./sigTools.js");
const eth_lightwallet_1 = require("eth-lightwallet");
const files_js_1 = require("./files.js");
const create_js_1 = require("./methods/create.js");
const info_js_1 = require("./methods/info.js");
const Web3 = require('web3');
const { yellow, red, blue, greenBright } = chalk_1.default;
const argv = minimist(process.argv.slice(2), {
    string: [
        '_',
        'a', 'address',
        'm', 'multisig',
        'd', 'dest',
        'sp', 's',
        'from', 'f'
    ],
});
// console.debug(argv)
var Cmd;
(function (Cmd) {
    Cmd[Cmd["help"] = 0] = "help";
    Cmd[Cmd["info"] = 1] = "info";
    Cmd[Cmd["add"] = 2] = "add";
    Cmd[Cmd["list"] = 3] = "list";
    Cmd[Cmd["ls"] = 4] = "ls";
    Cmd[Cmd["register"] = 5] = "register";
    Cmd[Cmd["sp"] = 6] = "sp";
    Cmd[Cmd["create"] = 7] = "create";
    Cmd[Cmd["mk"] = 8] = "mk";
    Cmd[Cmd["sign"] = 9] = "sign";
    Cmd[Cmd["send"] = 10] = "send";
})(Cmd || (Cmd = {}));
const subcommand = Cmd[argv._[0]] || Cmd.help;
async function Help() {
    console.log('USAGE');
    console.log(`  node cli.js <subcommand>`);
    console.log('');
    console.log('SUBCOMMANDS');
    console.log('  ' + Object.keys(Cmd)
        .filter(v => /^\d+$/.test(v) === false)
        .filter(v => v.length > 2) // remove short names
        .filter(value => [
        Cmd[Cmd.help],
        Cmd[Cmd.create],
    ].includes(value) == false) // blacklisted
        .sort()
        .join(', '));
    console.log('');
    console.log("Try 'node cli.js <subcommand> -h' to learn more about each command");
}
async function register() {
    if (argv.h) {
        console.log("USAGE");
        console.log("  register");
        return;
    }
    const newSeed = eth_lightwallet_1.keystore.generateRandomSeed();
    const [ks, keyFromPw] = await sigTools_js_1.retrieveKeystore(newSeed, '');
    ks.generateNewAddress(keyFromPw, 1);
    const [signingAddr] = ks.getAddresses();
    console.log("Address: " + signingAddr);
    console.log("Seed:    " + newSeed);
}
async function tx() {
    if (subcommandNoArgs(argv)) {
        console.log("USAGE");
        console.log(`  ${Cmd[Cmd.send]} <sig1> <sig2>`);
        console.log("");
        console.log("ARGUMENTS");
        console.log("  two serialized signatures");
        console.log("");
        console.log("OPTIONS");
        console.log("  --from, -f from address");
        console.log("  --multisig, -m multisigAddress address");
        console.log("  --dest, -d destAddress address");
        return;
    }
    const destAddress = argv.d || argv.dest || require('../ethereum/build/contracts/SimpleContract.json').networks['1337'].address; // demo stuff
    const multisigAddress = argv.m || argv.multisig || require('../ethereum/build/contracts/SimpleMultiSig.json').networks['1337'].address; // dev stuff
    const from = argv.from || argv.f;
    console.assert(destAddress, "did not find dest address");
    console.assert(multisigAddress, "did not find MultiSig address");
    console.assert(from, "did not get from");
    const sig1 = JSON.parse(argv._[1]); // {"sigV":28,"sigR":"0x7d223c507acf17887340f364f7cf910ec54dfb2f10e08ce5ddc3d60bf9b221b3","sigS":"0x1bdd9f4ba9afd5466b59010746caf55dd396769a1c8a8c001e3ee693276af1d3"}
    const sig2 = JSON.parse(argv._[2]); // {"sigV":28,"sigR":"0x7d223c507acf17887340f364f7cf910ec54dfb2f10e08ce5ddc3d60bf9b221b3","sigS":"0x1bdd9f4ba9afd5466b59010746caf55dd396769a1c8a8c001e3ee693276af1d3"}
    // validate all input
    new Array(sig1, sig2)
        .forEach((sig, index) => console.assert(sig.sigV && sig.sigR && sig.sigS, index + ": missing V, R or S", sig));
    sigTools_js_1.callNextStateMultiSig(sig1, sig2, destAddress, multisigAddress, from);
}
async function sign() {
    if (subcommandNoArgs(argv)) {
        console.log("USAGE");
        console.log("  sign -s 0x123 -m 0x234 -d 0x345 -f 0x456");
        console.log("");
        console.log("OPTIONS");
        console.log("  --dest, -d address of the business contract");
        console.log("  --multisig, -m address of the multisig contract");
        console.log("  --seed, -s seed words to signing HD wallet");
        console.log("  --from, -f transaction from address");
        return;
    }
    const seedPhrase = argv.s || argv.seed;
    const password = argv.p || argv.password || '';
    const multisigAddr = argv.m || argv.multisig || require('../ethereum/build/contracts/SimpleMultiSig.json').networks['1337'].address; // dev stuff
    console.assert(seedPhrase, "need seedPhrase");
    console.assert(multisigAddr, "need multisigAddr");
    console.assert(!!password || password === '', "need password");
    const web3 = new Web3('http://localhost:7545');
    const multisigInstance = new web3.eth.Contract(require('../ethereum/build/contracts/SimpleMultiSig').abi, multisigAddr, {
        from: argv.from || argv.f,
    });
    multisigInstance.methods.nonce().call().then(async (nonce) => {
        const destAddr = argv.d || argv.dest || require('../ethereum/build/contracts/SimpleContract.json').networks['1337'].address; // demo stuff
        console.assert(destAddr, 'missing dest address');
        const [ks, keyFromPw] = await sigTools_js_1.retrieveKeystore(seedPhrase, password);
        ks.generateNewAddress(keyFromPw, 1);
        const [signingAddr] = ks.getAddresses();
        let s;
        try {
            s = sigTools_js_1.createSig(ks, signingAddr, keyFromPw, multisigAddr, nonce, 'nextState', destAddr); // TODO dont hardcode method
            console.log('Signature:');
            console.log(JSON.stringify(s));
        }
        catch (e) {
            console.error(red(e.toString()));
            console.error(e);
        }
    });
}
async function add() {
    if (subcommandNoArgs(argv)) {
        console.log("USAGE");
        console.log("  add -s 0x123 -a 0x456");
        console.log("");
        console.log("OPTIONS");
        console.log("  -a the address of the main contract");
        console.log("  --subcontract, -s the address of the subcontract to be added");
        return;
    }
    // const mainContractAddress:string = argv.a || argv.address
    const subcontractAddress = argv.s || argv.subcontract;
    // console.assert(mainContractAddress)
    const networkId = argv.networkId || '1337';
    console.assert(networkId);
    console.assert(subcontractAddress);
    console.assert(argv.a);
    console.assert(argv.from || argv.f);
    const web3 = new Web3('http://localhost:7545');
    const instance = new web3.eth.Contract(require('../ethereum/build/contracts/Sp1.json').abi, argv.a, {});
    instance.methods.add(subcontractAddress)
        .send({
        from: argv.from || argv.f,
    })
        .then(() => {
        instance.methods.subcontract().call().then(val => {
            console.assert(val.toString().toLowerCase() === subcontractAddress.toLowerCase(), "Was not set correct " + red(val));
        });
    });
}
function subcommandNoArgs(argv) {
    return (argv.h || argv._.length === 1);
}
const handlers = new Map();
handlers.set(Cmd.info, async () => {
    if (subcommandNoArgs(argv)) {
        console.log('USAGE');
        console.log('  node cli.js info <address>');
        return;
    }
    const networkId = argv.networkId || '1337';
    const contractAddress = argv._[1];
    console.assert(contractAddress, "please provide an address");
    await info_js_1.info(contractAddress, networkId);
});
handlers.set(Cmd.add, add);
handlers.set(Cmd.send, tx);
handlers.set(Cmd.help, Help);
handlers.set(Cmd.sign, sign);
handlers.set(Cmd.register, register);
handlers.set(Cmd.sp, handlers.get(Cmd.register));
handlers.set(Cmd.list, async () => {
    if (argv.h) {
        console.log("USAGE");
        console.log("  node cli.js list");
        return;
    }
    const networkId = argv.networkId || '1337';
    const allContracts = await files_js_1.getDeployedContracts2();
    console.log(`CONTRACTS OVERVIEW`);
    console.log("");
    allContracts
        .map(contract => ({
        name: `  ${contract.contractName}`,
        address: `    ${contract.address}`,
    }))
        .forEach(vm => Object.values(vm).forEach(val => console.log(val)));
});
handlers.set(Cmd.ls, handlers.get(Cmd.list));
handlers.set(Cmd.create, async () => {
    if (subcommandNoArgs(argv)) {
        console.log("USAGE");
        console.log(`  node.cli create --from 0x123 <contract name> <constructor arguments>`);
        console.log(``);
        console.log(`OPTIONS`);
        console.log(`  --from, -f is the sender address`);
        return;
    }
    const from = argv.f || argv.from;
    console.assert(from, "'create needs --from, -f");
    const tpl = argv._[1];
    console.assert(tpl, "Need a template name");
    const constructorArgs = argv._.slice(2);
    console.debug(tpl, constructorArgs);
    console.info("Creating: ", tpl);
    console.info("Passing: ", constructorArgs.map(val => `'${val}'`).join(', '));
    const contract = await create_js_1.create(constructorArgs, tpl, from);
    if (!argv.n) {
        await files_js_1.addDeployedContract(tpl, contract.options.address);
    }
});
handlers.set(Cmd.mk, handlers.get(Cmd.create));
const handler = handlers.get(subcommand) || handlers.get(Cmd.help);
console.assert(handler, "should have found handler");
handler();

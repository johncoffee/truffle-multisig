// const HDWalletProvider = require("truffle-hdwallet-provider")

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "1337" // Match any network id
    },
    // rinkfura: {
    //   provider: new HDWalletProvider("candy maple cake sugar pudding cream honey rich smooth crumble sweet treat", "https://rinkeby.infura.io/v3/9d9b175c53064013bc50d8d41faa429a"),
    //   network_id: 4
    // }
  }
}

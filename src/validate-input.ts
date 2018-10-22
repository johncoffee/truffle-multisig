
export function validate(subcommand,argv) {

  switch (subcommand) {
    case "create":
      const createName = argv._[1] || argv.name
      console.assert(createName, `create requires a source file, eg. create "HelloWorld.sol" or -i "HelloWorld.sol"`)
      break

    case "ls":
    case "list":
      break

    case "sign":
      // const inputId = argv._[1] || argv.i || argv.id
      const seedPhrase = argv.s || argv.seed
      // const password = argv.p || argv.password
      const multisigAddr = argv.m || argv.multisig
      const destAddr = argv.d || argv.dest

      // console.assert(password, "sign requires --password (-p)")
      console.assert(seedPhrase, "sign requires --seedphrase -s")
      console.assert(!(argv.n == undefined && argv.nonce == undefined), "sign requires --nonce -n")

      // can be omitted
      // console.assert(destAddr, "sign requires --dest -d")
      // console.assert(multisigAddr, "sign multisig address --multisig -m")
      break

    case "help":
      break
  }
}


export function validate(subcommand,argv) {

  switch (subcommand) {
    case "create":
      console.assert(argv.s || argv.sp, "'create/deploy needs 'sp' -s or --sp")
      console.assert(argv.f || argv.from, "'create/deploy need 'from' --from")
      console.assert(argv.n || argv.name, `create/delpoy need 'name' --name"`)
      break

    case 'register':
      // console.assert(argv.name, `register requires name, eg. --name ServiceProvider`)
      break

    case "ls":
    case "list":
      break

    case "sign":
      const seedPhrase = argv.s || argv.seed
      // const password = argv.p || argv.password
      const multisigAddr = argv.m || argv.multisig
      const destAddr = argv.d || argv.dest

      // console.assert(password, "sign requires --password (-p)")
      console.assert(seedPhrase, "sign requires --seedphrase -s")

      // can be omitted
      // console.assert(destAddr, "sign requires --dest -d")
      // console.assert(multisigAddr, "sign multisig address --multisig -m")
      break

    case "help":
      break
  }
}

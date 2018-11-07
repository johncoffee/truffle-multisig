

#### This code base has NOT be reviewed by security experts and MUST therefore NOT be used, unless you are _the_ security expert or l33t h4x0r.


# Usage

Use NodeJS to `node dist/cli.js` - you might need to [install dependencies](#Installation and dependencies).

See a tutorial of doing a [two-party contract in the docs](./docs/two-party-contract.md).


### Installation and dependencies

 1.  We'll need NodeJS and npm 
 2.  Install the Truffle framework, and Ganache test-blockchain 
     `npm install -g ganache truffle`
     (access to a local or remote Ethereum node is not required)
 3.  Download this codebase, and do a `npm install`


#### Two sets of tools

There are two packages in this repo: 
The Truffle setup with unit tests, and the cli tool.
 
 They have slightly different 
TypeScript configurations - note the two `tsconfig.json` in `src/` and `ethereum/`.


#### Windows support

Yes. Please use [cmder](http://cmder.net/) as terminal emulator.

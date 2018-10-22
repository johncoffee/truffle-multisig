

# Guide

Try `node dist/cli.js`

It should achieve signing a contract with 2 signatures.


Steps 

1. Deploy a contract `node cli.js create hello.sol` 

    Create contract, save signing request as file

2. Sign the tha state change tx with 2 wallets

    `node cli.js sign -s "pretty harsh depart gloom whip quit stable turtle question supreme rather problem" -n 0 0x213 -m 0x333 -w 0x81213`
    
    gives
    
    `{"v": "0x123", "s": "0x123", "r": "0x123"}`
    
3. Call the multi sig

    `node cli.js tx -m register '{"v": "0x123", "s": "0x123", "r": "0x123"} {"v": "0x123", "s": "0x123", "r": "0x123"}'`
    

### Windows support
Yes. Please use [cmder](http://cmder.net/)



## 1st party, contract owner

1.  Obtain the address of the other party involved with the contract, this is needed when deploying the multisig contract
2.  Write and deploy a new smart contract  
    1.  Save the solidity code under `contracts`
    2.  Write a migration script, save it under `migrations`. 


## 2nd party

1.  Use the CLI to make a serialized, signed transaction

    `node cli.js sign -s "mnemonic words" -n 0 -d 0x213 -m 0x333`
    
    Gives `{"v": "0x123", "s": "0x456", "r": "0x789"}`
    
2. Give the transaction object to the 1st party, as they will also produce a 


# General work flow

1. Write and deploy a new smart contract.  
   i.   Write a contract, it under ethereum/contracts 
   ii.  Write a deployment script, save it under

2. Sign the tha state change tx with 2 wallets

    `node cli.js sign -s "pretty harsh depart gloom whip quit stable turtle question supreme rather problem" -n 0 0x213 -m 0x333 -w 0x81213`
    
    gives
    
    `{"v": "0x123", "s": "0x123", "r": "0x123"}`
    

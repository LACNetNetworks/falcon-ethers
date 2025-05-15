## LAC-NET Gas Model provider for ether.js

This repository contains the GasModelProvider ethers.js provider, an additional Provider to ethers.js to enable work with the gas model of LAC-NET.
Ethers.js v6 compatible

### Getting Started
Installation

    npm i @lacchain/gas-model-provider


### Usage
``` javascript
import { LacchainProvider, LacchainSigner } from '@lacchain/gas-model-provider';

const provider = new LacchainProvider(RPC_URL);
const signer: LacchainSigner = new LacchainSigner(
  PRIVATE_KEY,
  provider,
  NODE_ADDRESS,
  EXPIRATION
);
```

Where:
 - RPC_URL: the RPC url of your node (i.e. http://node-ip)
 - PRIVATE_KEY: is the ethereum account private key in hex
 - NODE_ADDRESS: the node address 
 - EXPIRATION: the expiration unix timestamp of the transaction

### Example

#### Deploy smart contract

``` javascript
import { ContractFactory } from 'ethers';
import { LacchainProvider, LacchainSigner } from '@lacchain/gas-model-provider';

const signer: LacchainSigner = new LacchainSigner(
  PRIVATE_KEY,
  new LacchainProvider(RPC_URL!),
  NODE_ADDRESS!,
  EXPIRATION
);

const contractFactory = new ContractFactory(
  CONTRACT_ABI,
  CONTRACT_BYTECODE,
  signer
);

const contract = await contractFactory.deploy();
const txReceipt = await contract.deploymentTransaction()?.wait();
console.log( `Contract Address: ${txReceipt?.contractAddress}` );
```

Where:
 - CONTRACT_ABI: is the contract ABI
 - CONTRACT_BYTECODE: is the contract bytecode

**Note: Don't use contract.address, instead use the example code above to get the contract address**

#### Invoke and call contract

``` javascript
import { Contract } from 'ethers';
import { LacchainProvider, LacchainSigner } from '@lacchain/gas-model-provider';

const signer: LacchainSigner = new LacchainSigner(
  PRIVATE_KEY,
  new LacchainProvider(RPC_URL!),
  NODE_ADDRESS!,
  EXPIRATION
);

const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

await (await contract.someContractFunction()).wait();
```

Where:
- CONTRACT_ADDRESS: is the contract address
- CONTRACT_ABI: is the contract ABI


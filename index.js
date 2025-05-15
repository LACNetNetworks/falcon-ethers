import { ethers } from "ethers";
import { LacchainProvider, LacchainSigner } from '@lacchain/gas-model-provider';
import { ContractFactory } from "ethers";
import falcon from "falcon-crypto";  // Import falcon-crypto package
import { hexlify, toUtf8Bytes } from "ethers";

import contractAbi from "./contractABI/Storage.json" assert { type: "json" };
import fs from "fs/promises"; // Use promises-based file system module


async function generateFalconSignature(message) {
  try {
    // Generate Falcon key pair

    const keyPair /*: {privateKey: Uint8Array; publicKey: Uint8Array} */ = await falcon.keyPair();

    const privateKey = keyPair.publicKey;
    const publicKey = keyPair.publicKey;

    console.log("Private Key:", privateKey.toString('hex'));
    console.log("Public Key:", publicKey.toString('hex'));

    // Convert message to bytes
    const msgBytes = Buffer.from(message, 'utf8');  // Convert string message to bytes

    // Generate Falcon signature for the message

    const signature  = await falcon.sign(message, keyPair.privateKey) ;

    console.log("Generated Falcon Signature (Hex):", signature.toString('hex'));

    return {
      signature: signature.toString('hex'),
      publicKey: publicKey.toString('hex'),
      privateKey: privateKey.toString('hex')
    };

  } catch (error) {
    console.error("Error generating Falcon signature:", error);
  }
}
async function sendTransactionWithFalconSig(falconSig,contract) {
  const msgValue = 100; // Example value
  const falconVerifier = "0x0000000000000000000000000000000000000065"; // Replace with actual verifier address

  // Prepare the function arguments
  const functionArgs = [
    falconSig.signature,  // Falcon signature (in hex)
    falconSig.publicKey,  // Public key (in hex)
    "hello", // Message as bytes
    falconVerifier,
    msgValue
  ];

  // Encode function call
  const encodedData = await contract.encodeFunctionData("store", functionArgs);

  // Create the transaction
  const tx = {
    to: contractAddress,
    gasLimit: ethers.BigNumber.from(500000),
    gasPrice: ethers.BigNumber.from(0),
    data: encodedData
  };

  // Send the transaction
  const txResponse = await wallet.sendTransaction(tx);
  console.log("Transaction sent:", txResponse.hash);

  // Wait for the transaction to be mined
  const receipt = await txResponse.wait();
  console.log("Transaction mined:", receipt);
}


// Encapsulate the logic in an async function
async function main() {
  try {
    // Load the bytecode from Storage.bin
    let rawBytecode = await fs.readFile("./contractABI/Storage.bin", "utf-8");
    rawBytecode = rawBytecode.trim(); // Remove extra spaces or newlines
    if (!rawBytecode.startsWith("0x")) {
      rawBytecode = "0x" + rawBytecode; // Add "0x" prefix if missing
    }
    const bytecode = rawBytecode;

    // Verify ABI and bytecode
    console.log("ABI:", contractAbi);
    console.log("Bytecode:", bytecode);

    // Configuration
    const yourRPCNode = "http://34.136.8.0";
    const nodeAddress = "0xb2e5ecebeb8e8617637d6364d9c6f6ee7508ac42";
    const privateKey = "a0a2af404337c096113bc2c180df7a6636a88f8eb5da6160817f9315aaafee80";
    const contractAddress = "0xFEf7c78793dF5aC704C023C6bC19d672cF8dED75";
    const provider = new LacchainProvider(yourRPCNode);   
    const signer = new LacchainSigner(privateKey, provider, nodeAddress, Date.now());
    
    // const contractFactory = new ethers.ContractFactory(contractAbi, bytecode, signer);
    
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, contractAbi, wallet);  


    //console.log("Deploying the contract...");
    //const contract = await contractFactory.get
    //await contract.deployed(); // Wait for deployment confirmation
    //console.log("Contract deployed at address:", contract.address);
    const caddress = await contract.getAddress();
   
    console.log("Contract instance created at:", caddress);
    // Example: Interacting with the deployed contract
  //  const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
  //  console.log("Contract instance created at:", contractInstance);
  const signature = await generateFalconSignature("hello");
  
  sendTransactionWithFalconSig(signature,contract);
  
} catch (error) {
    console.error("Error:", error.message);
  }
}



// Run the main function
main();
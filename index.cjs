const { ethers } = require("ethers");
const { LacchainProvider, LacchainSigner } = require("@lacchain/gas-model-provider");
const falcon = require("falcon-crypto");
const fs = require("fs/promises");

const { toUtf8Bytes, BigNumber } = ethers;

async function generateFalconSignature(message) {
  try {
    const keyPair = await falcon.keyPair();
    const privateKey = keyPair.privateKey;
    const publicKey = keyPair.publicKey;

    const signature = await falcon.sign(message, privateKey);

    return {
      signature,
      publicKey,
      privateKey,
    };
  } catch (error) {
    console.error("Error generating Falcon signature:", error);
    throw error;
  }
}

async function sendTransactionWithFalconSig(falconSig, contract, contractAddress, wallet) {
  const msgValue = 100;
  const falconVerifier = "0x0000000000000000000000000000000000000065";

  const functionArgs = [
    falconSig.signature,
    falconSig.publicKey,
    toUtf8Bytes("hello"),
    falconVerifier,
    msgValue,
  ];


const s = '0x' + Array.from(falconSig.signature)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

  const p = '0x' + Array.from(falconSig.publicKey)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

console.log("-----");
console.log("signature",s );
console.log("-----");
console.log("pk", p);


  const encodedData = contract.interface.encodeFunctionData("store", functionArgs);

  const tx = {
    to: contractAddress,
    gasLimit: 500_000n,  // n al final indica BigInt
    gasPrice: 0n,
    data: encodedData,
  };


  const txResponse = await wallet.sendTransaction(tx);
  console.log("Transaction sent:", txResponse.hash);
  

  const receipt = await txResponse.wait();
  console.log("Transaction mined:", receipt);
}

async function main() {
  try {
    let rawBytecode = await fs.readFile("./contractABI/Storage.bin", "utf-8");
    rawBytecode = rawBytecode.trim();
    if (!rawBytecode.startsWith("0x")) {
      rawBytecode = "0x" + rawBytecode;
    }

    const yourRPCNode = "http://34.136.8.0";
    const nodeAddress = "0xb2e5ecebeb8e8617637d6364d9c6f6ee7508ac42";
    const privateKey = "a0a2af404337c096113bc2c180df7a6636a88f8eb5da6160817f9315aaafee80";
    const contractAddress = "0xFEf7c78793dF5aC704C023C6bC19d672cF8dED75";

    const provider = new LacchainProvider(yourRPCNode);
    const signer = new LacchainSigner(privateKey, provider, nodeAddress, Date.now());

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, await fs.readFile("./contractABI/Storage.json", "utf-8"), wallet);

    console.log("Contract instance created at:", await contract.getAddress());

    const signature = await generateFalconSignature("hello");

    await sendTransactionWithFalconSig(signature, contract, contractAddress, wallet);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
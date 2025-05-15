import { ethers } from "ethers";
import { LacchainProvider, LacchainSigner } from "@lacchain/gas-model-provider";
import falcon from "falcon-crypto";
import { hexlify } from "ethers";
import fs from "fs/promises";

// Leer el ABI como JSON manualmente
const contractAbi = JSON.parse(await fs.readFile("./contractABI/Storage.json", "utf-8"));

async function generateFalconSignature(message) {
  try {
    const keyPair = await falcon.keyPair();
    const privateKey = keyPair.privateKey;
    const publicKey = keyPair.publicKey;

    console.log("Private Key:", privateKey.toString("hex"));
    console.log("Public Key:", publicKey.toString("hex"));

    const signature = await falcon.sign(message, privateKey);

    console.log("Generated Falcon Signature (Hex):", signature.toString("hex"));

    return {
      signature: signature.toString("hex"),
      publicKey: publicKey.toString("hex"),
      privateKey: privateKey.toString("hex"),
    };
  } catch (error) {
    console.error("Error generating Falcon signature:", error);
  }
}

async function sendTransactionWithFalconSig(falconSig, contract, contractAddress, wallet) {
  const msgValue = 100;
  const falconVerifier = "0x0000000000000000000000000000000000000065";

  const functionArgs = [
    falconSig.signature,
    falconSig.publicKey,
    "hello",
    falconVerifier,
    msgValue,
  ];

  const encodedData = contract.interface.encodeFunctionData("store", functionArgs);

  const tx = {
    to: contractAddress,
    gasLimit: ethers.BigNumber.from(500000),
    gasPrice: ethers.BigNumber.from(0),
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
    const bytecode = rawBytecode;

    const yourRPCNode = "http://34.136.8.0";
    const nodeAddress = "0xb2e5ecebeb8e8617637d6364d9c6f6ee7508ac42";
    const privateKey = "a0a2af404337c096113bc2c180df7a6636a88f8eb5da6160817f9315aaafee80";
    const contractAddress = "0xFEf7c78793dF5aC704C023C6bC19d672cF8dED75";

    const provider = new LacchainProvider(yourRPCNode);
    const signer = new LacchainSigner(privateKey, provider, nodeAddress, Date.now());

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

    const caddress = await contract.getAddress();
    console.log("Contract instance created at:", caddress);

    const signature = await generateFalconSignature("hello");

    await sendTransactionWithFalconSig(signature, contract, contractAddress, wallet);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
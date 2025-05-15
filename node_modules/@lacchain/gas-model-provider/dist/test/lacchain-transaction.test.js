"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const lacchain_transaction_1 = require("../lacchain-transaction");
describe('LacchainTransaction ', () => {
    let transaction;
    const aTestHash = 'a7c96262c21db9a06fd49e307d694fd95f624569f9b35bb3ffacd880440f9787';
    const anOriginalTx = ethers_1.Transaction.from('0xf8e4428082d558944f3f9061c42b396746bb9a232089703e4f9dbf7680b88452c28fab000000000000000000000000e81d7e5cd979be0a7f6b6c98957a66fdf6240273000000000000000000000000410bd47227a5ea8af81995fa3d66b770af6f85e2000000000000000000000000fda1303fc59b74b0926740b627770ced2ee98672000000000000000000000000000000000000000000000000000000006d7528211ba05313a3599a01d85aecb9792ffdf22f3f3b22b90bdd171a4e9f042719e7358f9da066f66b78938797f47a6cb54e759bbc0b4133c7b616760e0242848ae4c797de82');
    beforeEach(() => {
        transaction = new lacchain_transaction_1.LacchainTransaction(anOriginalTx, aTestHash);
    });
    test('new', () => {
        expect(transaction).toBeTruthy();
    });
    test('fixed hash value', () => {
        expect(transaction.hash).toEqual(aTestHash);
    });
    test('fixed hash', () => {
        expect(transaction.hash === anOriginalTx.hash).toBeFalsy();
    });
    test('type', () => {
        expect(transaction.type).toEqual(anOriginalTx.type);
    });
    test('typeName', () => {
        expect(transaction.typeName).toEqual(anOriginalTx.typeName);
    });
    test('to', () => {
        expect(transaction.to).toEqual(anOriginalTx.to);
    });
    test('nonce', () => {
        expect(transaction.nonce).toEqual(anOriginalTx.nonce);
    });
    test('gasLimit', () => {
        expect(transaction.gasLimit).toEqual(anOriginalTx.gasLimit);
    });
    test('gasPrice', () => {
        expect(transaction.gasPrice).toEqual(anOriginalTx.gasPrice);
    });
    test('maxPriorityFeePerGas', () => {
        expect(transaction.maxPriorityFeePerGas).toEqual(anOriginalTx.maxPriorityFeePerGas);
    });
    test('maxFeePerGas', () => {
        expect(transaction.maxFeePerGas).toEqual(anOriginalTx.maxFeePerGas);
    });
    test('data', () => {
        expect(transaction.data).toEqual(anOriginalTx.data);
    });
    test('value', () => {
        expect(transaction.value).toEqual(anOriginalTx.value);
    });
    test('chainId', () => {
        expect(transaction.chainId).toEqual(anOriginalTx.chainId);
    });
    test('signature', () => {
        expect(transaction.signature).toEqual(anOriginalTx.signature);
    });
    test('accessList', () => {
        expect(transaction.accessList).toEqual(anOriginalTx.accessList);
    });
    test('unsignedHash', () => {
        expect(transaction.unsignedHash).toEqual(anOriginalTx.unsignedHash);
    });
    test('from', () => {
        expect(transaction.from).toEqual(anOriginalTx.from);
    });
    test('fromPublicKey', () => {
        expect(transaction.fromPublicKey).toEqual(anOriginalTx.fromPublicKey);
    });
    test('serialized', () => {
        expect(transaction.serialized).toEqual(anOriginalTx.serialized);
    });
    test('unsignedSerialized', () => {
        expect(transaction.unsignedSerialized).toEqual(anOriginalTx.unsignedSerialized);
    });
});
//# sourceMappingURL=lacchain-transaction.test.js.map
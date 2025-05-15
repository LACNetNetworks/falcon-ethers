"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lacchain_transaction_request_1 = require("../lacchain-transaction-request");
const fixtures_1 = require("./fixtures");
describe('LacchainTransactionRequest', () => {
    let lacchainTxRequest;
    const lacchainDataExpected = '0x52c28fab000000000000000000000000e81d7e5cd979be0a7f6b6c98957a66fdf6240273000000000000000000000000410bd47227a5ea8af81995fa3d66b770af6f85e2000000000000000000000000c6e2459991bfe27cca6d86722f35da23a1e4cb97000000000000000000000000000000000000000000000000000000006d752821';
    beforeEach(() => {
        lacchainTxRequest = new lacchain_transaction_request_1.LacchainTransactionRequest(fixtures_1.anOriginalTxRequest, fixtures_1.aNodeAddress, fixtures_1.anExpirationTime);
    });
    test('new', () => {
        expect(lacchainTxRequest).toBeTruthy();
    });
    test('type', () => {
        expect(lacchainTxRequest.type).toEqual(fixtures_1.anOriginalTxRequest.type);
    });
    test('to', () => {
        expect(lacchainTxRequest.to).toEqual(fixtures_1.anOriginalTxRequest.to);
    });
    test('from', () => {
        expect(lacchainTxRequest.from).toEqual(fixtures_1.anOriginalTxRequest.from);
    });
    test('nonce', () => {
        expect(lacchainTxRequest.nonce).toEqual(fixtures_1.anOriginalTxRequest.nonce);
    });
    test('gasLimit', () => {
        expect(lacchainTxRequest.gasLimit).toEqual(fixtures_1.anOriginalTxRequest.gasLimit);
    });
    test('gasPrice', () => {
        expect(lacchainTxRequest.gasPrice).toEqual(fixtures_1.anOriginalTxRequest.gasPrice);
    });
    test('maxPriorityFeePerGas', () => {
        expect(lacchainTxRequest.maxPriorityFeePerGas).toEqual(fixtures_1.anOriginalTxRequest.maxPriorityFeePerGas);
    });
    test('maxFeePerGas', () => {
        expect(lacchainTxRequest.maxFeePerGas).toEqual(fixtures_1.anOriginalTxRequest.maxFeePerGas);
    });
    test('data', () => {
        expect(lacchainTxRequest.data).toEqual(lacchainDataExpected);
    });
    test('value', () => {
        expect(lacchainTxRequest.value).toEqual(fixtures_1.anOriginalTxRequest.value);
    });
    test('chainId', () => {
        expect(lacchainTxRequest.chainId).toEqual(0);
    });
    test('accessList', () => {
        expect(lacchainTxRequest.accessList).toEqual(fixtures_1.anOriginalTxRequest.accessList);
    });
    test('customData', () => {
        expect(lacchainTxRequest.customData).toEqual(fixtures_1.anOriginalTxRequest.customData);
    });
    test('blockTag', () => {
        expect(lacchainTxRequest.blockTag).toEqual(fixtures_1.anOriginalTxRequest.blockTag);
    });
    test('enableCciRead', () => {
        expect(lacchainTxRequest.enableCcipRead).toEqual(fixtures_1.anOriginalTxRequest.enableCcipRead);
    });
});
//# sourceMappingURL=lacchain-transaction-request.test.js.map
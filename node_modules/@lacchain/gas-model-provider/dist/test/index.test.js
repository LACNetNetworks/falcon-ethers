"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
describe('index.ts', () => {
    test('exports', () => {
        expect(index_1.LacchainSigner).toBeTruthy();
        expect(index_1.LacchainProvider).toBeTruthy();
        expect(index_1.LacchainTransaction).toBeTruthy();
        expect(index_1.LacchainTransactionRequest).toBeTruthy();
    });
});
//# sourceMappingURL=index.test.js.map
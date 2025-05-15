"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lacchain_provider_1 = require("../lacchain-provider");
describe('LacchainProvider', () => {
    test('new', () => {
        expect(new lacchain_provider_1.LacchainProvider('http://test.test')).toBeTruthy();
    });
});
//# sourceMappingURL=lacchain-provider.test.js.map
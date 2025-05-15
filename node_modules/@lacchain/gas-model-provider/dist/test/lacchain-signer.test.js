"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lacchain_signer_1 = require("../lacchain-signer");
const fixtures_1 = require("./fixtures");
describe('LacchainSigner', () => {
    let signer;
    const aProvider = {};
    beforeEach(() => {
        signer = new lacchain_signer_1.LacchainSigner(fixtures_1.aPrivateKey, aProvider, fixtures_1.aNodeAddress, fixtures_1.anExpirationTime);
    });
    test('new', () => {
        expect(signer).toBeTruthy();
    });
    test('signTransaction', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(yield signer.signTransaction(fixtures_1.anOriginalTxRequest)).toEqual(fixtures_1.aSignedTxRequest);
    }));
});
//# sourceMappingURL=lacchain-signer.test.js.map
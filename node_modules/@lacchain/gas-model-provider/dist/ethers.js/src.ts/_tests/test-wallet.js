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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const utils_js_1 = require("./utils.js");
const index_js_1 = require("../index.js");
describe("Test Private Key Wallet", function () {
    const tests = (0, utils_js_1.loadTests)("accounts");
    tests.forEach(({ name, privateKey, address }) => {
        it(`creates wallet: ${name}`, function () {
            const wallet = new index_js_1.Wallet(privateKey);
            assert_1.default.equal(wallet.privateKey, privateKey);
            assert_1.default.equal(wallet.address, address);
        });
    });
});
describe("Test Transaction Signing", function () {
    const tests = (0, utils_js_1.loadTests)("transactions");
    for (const test of tests) {
        it(`tests signing a legacy transaction: ${test.name}`, function () {
            return __awaiter(this, void 0, void 0, function* () {
                const wallet = new index_js_1.Wallet(test.privateKey);
                const txData = Object.assign({}, test.transaction, { type: 0, accessList: undefined, maxFeePerGas: undefined, maxPriorityFeePerGas: undefined });
                // Use the testcase sans the chainId for a legacy test
                if (txData.chainId != null && parseInt(txData.chainId) != 0) {
                    txData.chainId = "0x00";
                }
                const signed = yield wallet.signTransaction(txData);
                assert_1.default.equal(signed, test.signedLegacy, "signedLegacy");
            });
        });
    }
    for (const test of tests) {
        if (!test.signedEip155) {
            continue;
        }
        it(`tests signing an EIP-155 transaction: ${test.name}`, function () {
            return __awaiter(this, void 0, void 0, function* () {
                const wallet = new index_js_1.Wallet(test.privateKey);
                const txData = Object.assign({}, test.transaction, { type: 0, accessList: undefined, maxFeePerGas: undefined, maxPriorityFeePerGas: undefined });
                const signed = yield wallet.signTransaction(txData);
                assert_1.default.equal(signed, test.signedEip155, "signedEip155");
            });
        });
    }
    for (const test of tests) {
        it(`tests signing a Berlin transaction: ${test.name}`, function () {
            return __awaiter(this, void 0, void 0, function* () {
                const wallet = new index_js_1.Wallet(test.privateKey);
                const txData = Object.assign({}, test.transaction, { type: 1, maxFeePerGas: undefined, maxPriorityFeePerGas: undefined });
                const signed = yield wallet.signTransaction(txData);
                assert_1.default.equal(signed, test.signedBerlin, "signedBerlin");
            });
        });
    }
    for (const test of tests) {
        it(`tests signing a London transaction: ${test.name}`, function () {
            return __awaiter(this, void 0, void 0, function* () {
                const wallet = new index_js_1.Wallet(test.privateKey);
                const txData = Object.assign({}, test.transaction, { type: 2 });
                const signed = yield wallet.signTransaction(txData);
                assert_1.default.equal(signed, test.signedLondon, "signedLondon");
            });
        });
    }
});
describe("Test Message Signing (EIP-191)", function () {
});
describe("Test Typed-Data Signing (EIP-712)", function () {
    const tests = (0, utils_js_1.loadTests)("typed-data");
    for (const test of tests) {
        const { privateKey, signature } = test;
        if (privateKey == null || signature == null) {
            continue;
        }
        it(`tests signing typed-data: ${test.name}`, function () {
            return __awaiter(this, void 0, void 0, function* () {
                const wallet = new index_js_1.Wallet(privateKey);
                const sig = yield wallet.signTypedData(test.domain, test.types, test.data);
                assert_1.default.equal(sig, signature, "signature");
            });
        });
    }
});
describe("Test Wallet Encryption", function () {
    const password = "foobar";
    // Loop:
    //  1 : random wallet (uses HDNodeWallet under the hood)
    //  2 : Wallet using private key (uses Wallet explicitly)
    for (let i = 0; i < 2; i++) {
        let wallet = index_js_1.Wallet.createRandom();
        it("encrypts a random wallet: sync", function () {
            this.timeout(30000);
            const json = wallet.encryptSync(password);
            const decrypted = index_js_1.Wallet.fromEncryptedJsonSync(json, password);
            assert_1.default.equal(decrypted.address, wallet.address, "address");
        });
        it("encrypts a random wallet: async", function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(30000);
                const json = yield wallet.encrypt(password);
                const decrypted = yield index_js_1.Wallet.fromEncryptedJson(json, password);
                assert_1.default.equal(decrypted.address, wallet.address, "address");
            });
        });
        wallet = new index_js_1.Wallet((0, index_js_1.hexlify)((0, index_js_1.randomBytes)(32)));
    }
});
//# sourceMappingURL=test-wallet.js.map
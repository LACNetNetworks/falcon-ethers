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
const index_js_1 = require("../index.js");
const create_provider_js_1 = require("./create-provider.js");
function stall(duration) {
    return new Promise((resolve) => { setTimeout(resolve, duration); });
}
(0, create_provider_js_1.setupProviders)();
describe("Sends Transactions", function () {
    const wallet = new index_js_1.Wallet((process.env.FAUCET_PRIVATEKEY));
    console.log("Faucet Address:", wallet.address);
    const networkName = "goerli";
    for (const providerName of create_provider_js_1.providerNames) {
        const provider = (0, create_provider_js_1.getProvider)(providerName, networkName);
        if (provider == null) {
            continue;
        }
        it(`tests sending: ${providerName}`, function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(180000);
                const w = wallet.connect(provider);
                const dustAddr = index_js_1.Wallet.createRandom().address;
                // Retry if another CI instance used our value
                let tx = null;
                for (let i = 0; i < 10; i++) {
                    try {
                        tx = yield w.sendTransaction({
                            to: dustAddr,
                            value: 42,
                            type: 2
                        });
                        break;
                    }
                    catch (error) {
                        if ((0, index_js_1.isError)(error, "REPLACEMENT_UNDERPRICED") || (0, index_js_1.isError)(error, "NONCE_EXPIRED")) {
                            yield stall(1000);
                            continue;
                        }
                        throw error;
                    }
                }
                assert_1.default.ok(!!tx, "too many retries");
                //const receipt = 
                yield provider.waitForTransaction(tx.hash, null, 60000); //tx.wait();
                //console.log(receipt);
                const balance = yield provider.getBalance(dustAddr);
                assert_1.default.equal(balance, BigInt(42), "target balance after send");
            });
        });
    }
});
//# sourceMappingURL=test-providers-send.js.map
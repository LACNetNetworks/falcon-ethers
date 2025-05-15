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
const utils_js_1 = require("./utils.js");
describe("Test Etherscan extra APIs", function () {
    (0, utils_js_1.retryIt)("test etherscanProvider.getContract", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new index_js_1.EtherscanProvider("mainnet", "FPFGK6JSW2UHJJ2666FG93KP7WC999MNW7");
            const contract = yield provider.getContract("dai.tokens.ethers.eth");
            assert_1.default.ok(contract != null, "contract == null");
            assert_1.default.equal(yield contract.symbol(), "DAI", "contract.symbol");
        });
    });
});
//# sourceMappingURL=test-providers-extra.js.map
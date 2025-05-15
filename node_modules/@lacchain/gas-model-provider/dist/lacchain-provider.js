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
exports.LacchainProvider = void 0;
const ethers_1 = require("ethers");
const lacchain_transaction_1 = require("./lacchain-transaction");
class LacchainProvider extends ethers_1.JsonRpcProvider {
    constructor(url, network, options) {
        super(url, network, Object.assign({ batchMaxSize: 1 }, options));
    }
    _perform(req) {
        const _super = Object.create(null, {
            _perform: { get: () => super._perform }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield _super._perform.call(this, req);
            if (req.method === 'getTransactionReceipt' && result) {
                delete result.root;
                result.confirmations = 1;
            }
            return result;
        });
    }
    broadcastTransaction(signedTx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { blockNumber, hash, network } = yield (0, ethers_1.resolveProperties)({
                blockNumber: this.getBlockNumber(),
                hash: this._perform({
                    method: 'broadcastTransaction',
                    signedTransaction: signedTx,
                }),
                network: this.getNetwork(),
            });
            const tx = new lacchain_transaction_1.LacchainTransaction(ethers_1.Transaction.from(signedTx), hash);
            if (tx.hash !== hash) {
                throw new Error('@TODO: the returned hash did not match');
            }
            return this._wrapTransactionResponse(tx, network).replaceableTransaction(blockNumber);
        });
    }
}
exports.LacchainProvider = LacchainProvider;
//# sourceMappingURL=lacchain-provider.js.map
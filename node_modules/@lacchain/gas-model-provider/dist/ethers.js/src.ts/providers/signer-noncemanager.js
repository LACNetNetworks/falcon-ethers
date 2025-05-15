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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _NonceManager_noncePromise, _NonceManager_delta;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonceManager = void 0;
const index_js_1 = require("../utils/index.js");
const abstract_signer_js_1 = require("./abstract-signer.js");
/**
 *  A **NonceManager** wraps another [[Signer]] and automatically manages
 *  the nonce, ensuring serialized and sequential nonces are used during
 *  transaction.
 */
class NonceManager extends abstract_signer_js_1.AbstractSigner {
    /**
     *  Creates a new **NonceManager** to manage %%signer%%.
     */
    constructor(signer) {
        super(signer.provider);
        _NonceManager_noncePromise.set(this, void 0);
        _NonceManager_delta.set(this, void 0);
        (0, index_js_1.defineProperties)(this, { signer });
        __classPrivateFieldSet(this, _NonceManager_noncePromise, null, "f");
        __classPrivateFieldSet(this, _NonceManager_delta, 0, "f");
    }
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signer.getAddress();
        });
    }
    connect(provider) {
        return new NonceManager(this.signer.connect(provider));
    }
    getNonce(blockTag) {
        const _super = Object.create(null, {
            getNonce: { get: () => super.getNonce }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (blockTag === "pending") {
                if (__classPrivateFieldGet(this, _NonceManager_noncePromise, "f") == null) {
                    __classPrivateFieldSet(this, _NonceManager_noncePromise, _super.getNonce.call(this, "pending"), "f");
                }
                const delta = __classPrivateFieldGet(this, _NonceManager_delta, "f");
                return (yield __classPrivateFieldGet(this, _NonceManager_noncePromise, "f")) + delta;
            }
            return _super.getNonce.call(this, blockTag);
        });
    }
    /**
     *  Manually increment the nonce. This may be useful when managng
     *  offline transactions.
     */
    increment() {
        var _a;
        __classPrivateFieldSet(this, _NonceManager_delta, (_a = __classPrivateFieldGet(this, _NonceManager_delta, "f"), _a++, _a), "f");
    }
    /**
     *  Resets the nonce, causing the **NonceManager** to reload the current
     *  nonce from the blockchain on the next transaction.
     */
    reset() {
        __classPrivateFieldSet(this, _NonceManager_delta, 0, "f");
        __classPrivateFieldSet(this, _NonceManager_noncePromise, null, "f");
    }
    sendTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const noncePromise = this.getNonce("pending");
            this.increment();
            tx = yield this.signer.populateTransaction(tx);
            tx.nonce = yield noncePromise;
            // @TODO: Maybe handle interesting/recoverable errors?
            // Like don't increment if the tx was certainly not sent
            return yield this.signer.sendTransaction(tx);
        });
    }
    signTransaction(tx) {
        return this.signer.signTransaction(tx);
    }
    signMessage(message) {
        return this.signer.signMessage(message);
    }
    signTypedData(domain, types, value) {
        return this.signer.signTypedData(domain, types, value);
    }
}
exports.NonceManager = NonceManager;
_NonceManager_noncePromise = new WeakMap(), _NonceManager_delta = new WeakMap();
//# sourceMappingURL=signer-noncemanager.js.map
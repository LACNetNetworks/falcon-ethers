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
var _BaseWallet_signingKey;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWallet = void 0;
const index_js_1 = require("../address/index.js");
const index_js_2 = require("../hash/index.js");
const index_js_3 = require("../providers/index.js");
const index_js_4 = require("../transaction/index.js");
const index_js_5 = require("../utils/index.js");
/**
 *  The **BaseWallet** is a stream-lined implementation of a
 *  [[Signer]] that operates with a private key.
 *
 *  It is preferred to use the [[Wallet]] class, as it offers
 *  additional functionality and simplifies loading a variety
 *  of JSON formats, Mnemonic Phrases, etc.
 *
 *  This class may be of use for those attempting to implement
 *  a minimal Signer.
 */
class BaseWallet extends index_js_3.AbstractSigner {
    /**
     *  Creates a new BaseWallet for %%privateKey%%, optionally
     *  connected to %%provider%%.
     *
     *  If %%provider%% is not specified, only offline methods can
     *  be used.
     */
    constructor(privateKey, provider) {
        super(provider);
        _BaseWallet_signingKey.set(this, void 0);
        (0, index_js_5.assertArgument)(privateKey && typeof (privateKey.sign) === "function", "invalid private key", "privateKey", "[ REDACTED ]");
        __classPrivateFieldSet(this, _BaseWallet_signingKey, privateKey, "f");
        const address = (0, index_js_4.computeAddress)(this.signingKey.publicKey);
        (0, index_js_5.defineProperties)(this, { address });
    }
    // Store private values behind getters to reduce visibility
    // in console.log
    /**
     *  The [[SigningKey]] used for signing payloads.
     */
    get signingKey() { return __classPrivateFieldGet(this, _BaseWallet_signingKey, "f"); }
    /**
     *  The private key for this wallet.
     */
    get privateKey() { return this.signingKey.privateKey; }
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () { return this.address; });
    }
    connect(provider) {
        return new BaseWallet(__classPrivateFieldGet(this, _BaseWallet_signingKey, "f"), provider);
    }
    signTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            // Replace any Addressable or ENS name with an address
            const { to, from } = yield (0, index_js_5.resolveProperties)({
                to: (tx.to ? (0, index_js_1.resolveAddress)(tx.to, this.provider) : undefined),
                from: (tx.from ? (0, index_js_1.resolveAddress)(tx.from, this.provider) : undefined)
            });
            if (to != null) {
                tx.to = to;
            }
            if (from != null) {
                tx.from = from;
            }
            if (tx.from != null) {
                (0, index_js_5.assertArgument)((0, index_js_1.getAddress)((tx.from)) === this.address, "transaction from address mismatch", "tx.from", tx.from);
                delete tx.from;
            }
            // Build the transaction
            const btx = index_js_4.Transaction.from(tx);
            btx.signature = this.signingKey.sign(btx.unsignedHash);
            return btx.serialized;
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.signMessageSync(message);
        });
    }
    // @TODO: Add a secialized signTx and signTyped sync that enforces
    // all parameters are known?
    /**
     *  Returns the signature for %%message%% signed with this wallet.
     */
    signMessageSync(message) {
        return this.signingKey.sign((0, index_js_2.hashMessage)(message)).serialized;
    }
    signTypedData(domain, types, value) {
        return __awaiter(this, void 0, void 0, function* () {
            // Populate any ENS names
            const populated = yield index_js_2.TypedDataEncoder.resolveNames(domain, types, value, (name) => __awaiter(this, void 0, void 0, function* () {
                // @TODO: this should use resolveName; addresses don't
                //        need a provider
                (0, index_js_5.assert)(this.provider != null, "cannot resolve ENS names without a provider", "UNSUPPORTED_OPERATION", {
                    operation: "resolveName",
                    info: { name }
                });
                const address = yield this.provider.resolveName(name);
                (0, index_js_5.assert)(address != null, "unconfigured ENS name", "UNCONFIGURED_NAME", {
                    value: name
                });
                return address;
            }));
            return this.signingKey.sign(index_js_2.TypedDataEncoder.hash(populated.domain, types, populated.value)).serialized;
        });
    }
}
exports.BaseWallet = BaseWallet;
_BaseWallet_signingKey = new WeakMap();
//# sourceMappingURL=base-wallet.js.map
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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _VoidSigner_instances, _VoidSigner_throwUnsupported;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoidSigner = exports.AbstractSigner = void 0;
/**
 *  Generally the [[Wallet]] and [[JsonRpcSigner]] and their sub-classes
 *  are sufficent for most developers, but this is provided to
 *  fascilitate more complex Signers.
 *
 *  @_section: api/providers/abstract-signer: Subclassing Signer [abstract-signer]
 */
const index_js_1 = require("../address/index.js");
const index_js_2 = require("../transaction/index.js");
const index_js_3 = require("../utils/index.js");
const provider_js_1 = require("./provider.js");
function checkProvider(signer, operation) {
    if (signer.provider) {
        return signer.provider;
    }
    (0, index_js_3.assert)(false, "missing provider", "UNSUPPORTED_OPERATION", { operation });
}
function populate(signer, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        let pop = (0, provider_js_1.copyRequest)(tx);
        if (pop.to != null) {
            pop.to = (0, index_js_1.resolveAddress)(pop.to, signer);
        }
        if (pop.from != null) {
            const from = pop.from;
            pop.from = Promise.all([
                signer.getAddress(),
                (0, index_js_1.resolveAddress)(from, signer)
            ]).then(([address, from]) => {
                (0, index_js_3.assertArgument)(address.toLowerCase() === from.toLowerCase(), "transaction from mismatch", "tx.from", from);
                return address;
            });
        }
        else {
            pop.from = signer.getAddress();
        }
        return yield (0, index_js_3.resolveProperties)(pop);
    });
}
/**
 *  An **AbstractSigner** includes most of teh functionality required
 *  to get a [[Signer]] working as expected, but requires a few
 *  Signer-specific methods be overridden.
 *
 */
class AbstractSigner {
    /**
     *  Creates a new Signer connected to %%provider%%.
     */
    constructor(provider) {
        (0, index_js_3.defineProperties)(this, { provider: (provider || null) });
    }
    getNonce(blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            return checkProvider(this, "getTransactionCount").getTransactionCount(yield this.getAddress(), blockTag);
        });
    }
    populateCall(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const pop = yield populate(this, tx);
            return pop;
        });
    }
    populateTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = checkProvider(this, "populateTransaction");
            const pop = yield populate(this, tx);
            if (pop.nonce == null) {
                pop.nonce = yield this.getNonce("pending");
            }
            if (pop.gasLimit == null) {
                pop.gasLimit = yield this.estimateGas(pop);
            }
            // Populate the chain ID
            const network = yield (this.provider).getNetwork();
            if (pop.chainId != null) {
                const chainId = (0, index_js_3.getBigInt)(pop.chainId);
                (0, index_js_3.assertArgument)(chainId === network.chainId, "transaction chainId mismatch", "tx.chainId", tx.chainId);
            }
            else {
                pop.chainId = network.chainId;
            }
            // Do not allow mixing pre-eip-1559 and eip-1559 properties
            const hasEip1559 = (pop.maxFeePerGas != null || pop.maxPriorityFeePerGas != null);
            if (pop.gasPrice != null && (pop.type === 2 || hasEip1559)) {
                (0, index_js_3.assertArgument)(false, "eip-1559 transaction do not support gasPrice", "tx", tx);
            }
            else if ((pop.type === 0 || pop.type === 1) && hasEip1559) {
                (0, index_js_3.assertArgument)(false, "pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "tx", tx);
            }
            if ((pop.type === 2 || pop.type == null) && (pop.maxFeePerGas != null && pop.maxPriorityFeePerGas != null)) {
                // Fully-formed EIP-1559 transaction (skip getFeeData)
                pop.type = 2;
            }
            else if (pop.type === 0 || pop.type === 1) {
                // Explicit Legacy or EIP-2930 transaction
                // We need to get fee data to determine things
                const feeData = yield provider.getFeeData();
                (0, index_js_3.assert)(feeData.gasPrice != null, "network does not support gasPrice", "UNSUPPORTED_OPERATION", {
                    operation: "getGasPrice"
                });
                // Populate missing gasPrice
                if (pop.gasPrice == null) {
                    pop.gasPrice = feeData.gasPrice;
                }
            }
            else {
                // We need to get fee data to determine things
                const feeData = yield provider.getFeeData();
                if (pop.type == null) {
                    // We need to auto-detect the intended type of this transaction...
                    if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                        // The network supports EIP-1559!
                        // Upgrade transaction from null to eip-1559
                        pop.type = 2;
                        if (pop.gasPrice != null) {
                            // Using legacy gasPrice property on an eip-1559 network,
                            // so use gasPrice as both fee properties
                            const gasPrice = pop.gasPrice;
                            delete pop.gasPrice;
                            pop.maxFeePerGas = gasPrice;
                            pop.maxPriorityFeePerGas = gasPrice;
                        }
                        else {
                            // Populate missing fee data
                            if (pop.maxFeePerGas == null) {
                                pop.maxFeePerGas = feeData.maxFeePerGas;
                            }
                            if (pop.maxPriorityFeePerGas == null) {
                                pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                            }
                        }
                    }
                    else if (feeData.gasPrice != null) {
                        // Network doesn't support EIP-1559...
                        // ...but they are trying to use EIP-1559 properties
                        (0, index_js_3.assert)(!hasEip1559, "network does not support EIP-1559", "UNSUPPORTED_OPERATION", {
                            operation: "populateTransaction"
                        });
                        // Populate missing fee data
                        if (pop.gasPrice == null) {
                            pop.gasPrice = feeData.gasPrice;
                        }
                        // Explicitly set untyped transaction to legacy
                        // @TODO: Maybe this shold allow type 1?
                        pop.type = 0;
                    }
                    else {
                        // getFeeData has failed us.
                        (0, index_js_3.assert)(false, "failed to get consistent fee data", "UNSUPPORTED_OPERATION", {
                            operation: "signer.getFeeData"
                        });
                    }
                }
                else if (pop.type === 2) {
                    // Explicitly using EIP-1559
                    // Populate missing fee data
                    if (pop.maxFeePerGas == null) {
                        pop.maxFeePerGas = feeData.maxFeePerGas;
                    }
                    if (pop.maxPriorityFeePerGas == null) {
                        pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                    }
                }
            }
            //@TOOD: Don't await all over the place; save them up for
            // the end for better batching
            return yield (0, index_js_3.resolveProperties)(pop);
        });
    }
    estimateGas(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            return checkProvider(this, "estimateGas").estimateGas(yield this.populateCall(tx));
        });
    }
    call(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            return checkProvider(this, "call").call(yield this.populateCall(tx));
        });
    }
    resolveName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = checkProvider(this, "resolveName");
            return yield provider.resolveName(name);
        });
    }
    sendTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = checkProvider(this, "sendTransaction");
            const pop = yield this.populateTransaction(tx);
            delete pop.from;
            const txObj = index_js_2.Transaction.from(pop);
            return yield provider.broadcastTransaction(yield this.signTransaction(txObj));
        });
    }
}
exports.AbstractSigner = AbstractSigner;
/**
 *  A **VoidSigner** is a class deisgned to allow an address to be used
 *  in any API which accepts a Signer, but for which there are no
 *  credentials available to perform any actual signing.
 *
 *  This for example allow impersonating an account for the purpose of
 *  static calls or estimating gas, but does not allow sending transactions.
 */
class VoidSigner extends AbstractSigner {
    /**
     *  Creates a new **VoidSigner** with %%address%% attached to
     *  %%provider%%.
     */
    constructor(address, provider) {
        super(provider);
        _VoidSigner_instances.add(this);
        (0, index_js_3.defineProperties)(this, { address });
    }
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () { return this.address; });
    }
    connect(provider) {
        return new VoidSigner(this.address, provider);
    }
    signTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _VoidSigner_instances, "m", _VoidSigner_throwUnsupported).call(this, "transactions", "signTransaction");
        });
    }
    signMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _VoidSigner_instances, "m", _VoidSigner_throwUnsupported).call(this, "messages", "signMessage");
        });
    }
    signTypedData(domain, types, value) {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _VoidSigner_instances, "m", _VoidSigner_throwUnsupported).call(this, "typed-data", "signTypedData");
        });
    }
}
exports.VoidSigner = VoidSigner;
_VoidSigner_instances = new WeakSet(), _VoidSigner_throwUnsupported = function _VoidSigner_throwUnsupported(suffix, operation) {
    (0, index_js_3.assert)(false, `VoidSigner cannot sign ${suffix}`, "UNSUPPORTED_OPERATION", { operation });
};
//# sourceMappingURL=abstract-signer.js.map
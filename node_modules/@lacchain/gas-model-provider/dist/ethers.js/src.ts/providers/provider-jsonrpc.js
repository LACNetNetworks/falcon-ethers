"use strict";
/**
 *  One of the most common ways to interact with the blockchain is
 *  by a node running a JSON-RPC interface which can be connected to,
 *  based on the transport, using:
 *
 *  - HTTP or HTTPS - [[JsonRpcProvider]]
 *  - WebSocket - [[WebSocketProvider]]
 *  - IPC - [[IpcSocketProvider]]
 *
 * @_section: api/providers/jsonrpc:JSON-RPC Provider  [about-jsonrpcProvider]
 */
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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _JsonRpcApiProvider_instances, _JsonRpcApiProvider_options, _JsonRpcApiProvider_nextId, _JsonRpcApiProvider_payloads, _JsonRpcApiProvider_drainTimer, _JsonRpcApiProvider_notReady, _JsonRpcApiProvider_network, _JsonRpcApiProvider_pendingDetectNetwork, _JsonRpcApiProvider_scheduleDrain, _JsonRpcApiPollingProvider_pollingInterval, _JsonRpcProvider_connect;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRpcProvider = exports.JsonRpcApiPollingProvider = exports.JsonRpcApiProvider = exports.JsonRpcSigner = void 0;
// @TODO:
// - Add the batching API
// https://playground.open-rpc.org/?schemaUrl=https://raw.githubusercontent.com/ethereum/eth1.0-apis/assembled-spec/openrpc.json&uiSchema%5BappBar%5D%5Bui:splitView%5D=true&uiSchema%5BappBar%5D%5Bui:input%5D=false&uiSchema%5BappBar%5D%5Bui:examplesDropdown%5D=false
const index_js_1 = require("../abi/index.js");
const index_js_2 = require("../address/index.js");
const index_js_3 = require("../hash/index.js");
const index_js_4 = require("../transaction/index.js");
const index_js_5 = require("../utils/index.js");
const abstract_provider_js_1 = require("./abstract-provider.js");
const abstract_signer_js_1 = require("./abstract-signer.js");
const network_js_1 = require("./network.js");
const subscriber_filterid_js_1 = require("./subscriber-filterid.js");
const subscriber_polling_js_1 = require("./subscriber-polling.js");
const Primitive = "bigint,boolean,function,number,string,symbol".split(/,/g);
//const Methods = "getAddress,then".split(/,/g);
function deepCopy(value) {
    if (value == null || Primitive.indexOf(typeof (value)) >= 0) {
        return value;
    }
    // Keep any Addressable
    if (typeof (value.getAddress) === "function") {
        return value;
    }
    if (Array.isArray(value)) {
        return (value.map(deepCopy));
    }
    if (typeof (value) === "object") {
        return Object.keys(value).reduce((accum, key) => {
            accum[key] = value[key];
            return accum;
        }, {});
    }
    throw new Error(`should not happen: ${value} (${typeof (value)})`);
}
function stall(duration) {
    return new Promise((resolve) => { setTimeout(resolve, duration); });
}
function getLowerCase(value) {
    if (value) {
        return value.toLowerCase();
    }
    return value;
}
function isPollable(value) {
    return (value && typeof (value.pollingInterval) === "number");
}
const defaultOptions = {
    polling: false,
    staticNetwork: null,
    batchStallTime: 10,
    batchMaxSize: (1 << 20),
    batchMaxCount: 100,
    cacheTimeout: 250,
    pollingInterval: 4000
};
// @TODO: Unchecked Signers
class JsonRpcSigner extends abstract_signer_js_1.AbstractSigner {
    constructor(provider, address) {
        super(provider);
        address = (0, index_js_2.getAddress)(address);
        (0, index_js_5.defineProperties)(this, { address });
    }
    connect(provider) {
        (0, index_js_5.assert)(false, "cannot reconnect JsonRpcSigner", "UNSUPPORTED_OPERATION", {
            operation: "signer.connect"
        });
    }
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.address;
        });
    }
    // JSON-RPC will automatially fill in nonce, etc. so we just check from
    populateTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.populateCall(tx);
        });
    }
    // Returns just the hash of the transaction after sent, which is what
    // the bare JSON-RPC API does;
    sendUncheckedTransaction(_tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = deepCopy(_tx);
            const promises = [];
            // Make sure the from matches the sender
            if (tx.from) {
                const _from = tx.from;
                promises.push((() => __awaiter(this, void 0, void 0, function* () {
                    const from = yield (0, index_js_2.resolveAddress)(_from, this.provider);
                    (0, index_js_5.assertArgument)(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
                    tx.from = from;
                }))());
            }
            else {
                tx.from = this.address;
            }
            // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
            // wishes to use this, it is easy to specify explicitly, otherwise
            // we look it up for them.
            if (tx.gasLimit == null) {
                promises.push((() => __awaiter(this, void 0, void 0, function* () {
                    tx.gasLimit = yield this.provider.estimateGas(Object.assign(Object.assign({}, tx), { from: this.address }));
                }))());
            }
            // The address may be an ENS name or Addressable
            if (tx.to != null) {
                const _to = tx.to;
                promises.push((() => __awaiter(this, void 0, void 0, function* () {
                    tx.to = yield (0, index_js_2.resolveAddress)(_to, this.provider);
                }))());
            }
            // Wait until all of our properties are filled in
            if (promises.length) {
                yield Promise.all(promises);
            }
            const hexTx = this.provider.getRpcTransaction(tx);
            return this.provider.send("eth_sendTransaction", [hexTx]);
        });
    }
    sendTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            // This cannot be mined any earlier than any recent block
            const blockNumber = yield this.provider.getBlockNumber();
            // Send the transaction
            const hash = yield this.sendUncheckedTransaction(tx);
            // Unfortunately, JSON-RPC only provides and opaque transaction hash
            // for a response, and we need the actual transaction, so we poll
            // for it; it should show up very quickly
            return yield (new Promise((resolve, reject) => {
                const timeouts = [1000, 100];
                const checkTx = () => __awaiter(this, void 0, void 0, function* () {
                    // Try getting the transaction
                    const tx = yield this.provider.getTransaction(hash);
                    if (tx != null) {
                        resolve(tx.replaceableTransaction(blockNumber));
                        return;
                    }
                    // Wait another 4 seconds
                    this.provider._setTimeout(() => { checkTx(); }, timeouts.pop() || 4000);
                });
                checkTx();
            }));
        });
    }
    signTransaction(_tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = deepCopy(_tx);
            // Make sure the from matches the sender
            if (tx.from) {
                const from = yield (0, index_js_2.resolveAddress)(tx.from, this.provider);
                (0, index_js_5.assertArgument)(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
                tx.from = from;
            }
            else {
                tx.from = this.address;
            }
            const hexTx = this.provider.getRpcTransaction(tx);
            return yield this.provider.send("eth_signTransaction", [hexTx]);
        });
    }
    signMessage(_message) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = ((typeof (_message) === "string") ? (0, index_js_5.toUtf8Bytes)(_message) : _message);
            return yield this.provider.send("personal_sign", [
                (0, index_js_5.hexlify)(message), this.address.toLowerCase()
            ]);
        });
    }
    signTypedData(domain, types, _value) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = deepCopy(_value);
            // Populate any ENS names (in-place)
            const populated = yield index_js_3.TypedDataEncoder.resolveNames(domain, types, value, (value) => __awaiter(this, void 0, void 0, function* () {
                const address = yield (0, index_js_2.resolveAddress)(value);
                (0, index_js_5.assertArgument)(address != null, "TypedData does not support null address", "value", value);
                return address;
            }));
            return yield this.provider.send("eth_signTypedData_v4", [
                this.address.toLowerCase(),
                JSON.stringify(index_js_3.TypedDataEncoder.getPayload(populated.domain, types, populated.value))
            ]);
        });
    }
    unlock(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.provider.send("personal_unlockAccount", [
                this.address.toLowerCase(), password, null
            ]);
        });
    }
    // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
    _legacySignMessage(_message) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = ((typeof (_message) === "string") ? (0, index_js_5.toUtf8Bytes)(_message) : _message);
            return yield this.provider.send("eth_sign", [
                this.address.toLowerCase(), (0, index_js_5.hexlify)(message)
            ]);
        });
    }
}
exports.JsonRpcSigner = JsonRpcSigner;
/**
 *  The JsonRpcApiProvider is an abstract class and **MUST** be
 *  sub-classed.
 *
 *  It provides the base for all JSON-RPC-based Provider interaction.
 *
 *  Sub-classing Notes:
 *  - a sub-class MUST override _send
 *  - a sub-class MUST call the `_start()` method once connected
 */
class JsonRpcApiProvider extends abstract_provider_js_1.AbstractProvider {
    constructor(network, options) {
        super(network, options);
        _JsonRpcApiProvider_instances.add(this);
        _JsonRpcApiProvider_options.set(this, void 0);
        // The next ID to use for the JSON-RPC ID field
        _JsonRpcApiProvider_nextId.set(this, void 0);
        // Payloads are queued and triggered in batches using the drainTimer
        _JsonRpcApiProvider_payloads.set(this, void 0);
        _JsonRpcApiProvider_drainTimer.set(this, void 0);
        _JsonRpcApiProvider_notReady.set(this, void 0);
        _JsonRpcApiProvider_network.set(this, void 0);
        _JsonRpcApiProvider_pendingDetectNetwork.set(this, void 0);
        __classPrivateFieldSet(this, _JsonRpcApiProvider_nextId, 1, "f");
        __classPrivateFieldSet(this, _JsonRpcApiProvider_options, Object.assign({}, defaultOptions, options || {}), "f");
        __classPrivateFieldSet(this, _JsonRpcApiProvider_payloads, [], "f");
        __classPrivateFieldSet(this, _JsonRpcApiProvider_drainTimer, null, "f");
        __classPrivateFieldSet(this, _JsonRpcApiProvider_network, null, "f");
        __classPrivateFieldSet(this, _JsonRpcApiProvider_pendingDetectNetwork, null, "f");
        {
            let resolve = null;
            const promise = new Promise((_resolve) => {
                resolve = _resolve;
            });
            __classPrivateFieldSet(this, _JsonRpcApiProvider_notReady, { promise, resolve }, "f");
        }
        const staticNetwork = this._getOption("staticNetwork");
        if (typeof (staticNetwork) === "boolean") {
            (0, index_js_5.assertArgument)(!staticNetwork || network !== "any", "staticNetwork cannot be used on special network 'any'", "options", options);
            if (staticNetwork && network != null) {
                __classPrivateFieldSet(this, _JsonRpcApiProvider_network, network_js_1.Network.from(network), "f");
            }
        }
        else if (staticNetwork) {
            // Make sure any static network is compatbile with the provided netwrok
            (0, index_js_5.assertArgument)(network == null || staticNetwork.matches(network), "staticNetwork MUST match network object", "options", options);
            __classPrivateFieldSet(this, _JsonRpcApiProvider_network, staticNetwork, "f");
        }
    }
    /**
     *  Returns the value associated with the option %%key%%.
     *
     *  Sub-classes can use this to inquire about configuration options.
     */
    _getOption(key) {
        return __classPrivateFieldGet(this, _JsonRpcApiProvider_options, "f")[key];
    }
    /**
     *  Gets the [[Network]] this provider has committed to. On each call, the network
     *  is detected, and if it has changed, the call will reject.
     */
    get _network() {
        (0, index_js_5.assert)(__classPrivateFieldGet(this, _JsonRpcApiProvider_network, "f"), "network is not available yet", "NETWORK_ERROR");
        return __classPrivateFieldGet(this, _JsonRpcApiProvider_network, "f");
    }
    /**
     *  Resolves to the non-normalized value by performing %%req%%.
     *
     *  Sub-classes may override this to modify behavior of actions,
     *  and should generally call ``super._perform`` as a fallback.
     */
    _perform(req) {
        const _super = Object.create(null, {
            _perform: { get: () => super._perform }
        });
        return __awaiter(this, void 0, void 0, function* () {
            // Legacy networks do not like the type field being passed along (which
            // is fair), so we delete type if it is 0 and a non-EIP-1559 network
            if (req.method === "call" || req.method === "estimateGas") {
                let tx = req.transaction;
                if (tx && tx.type != null && (0, index_js_5.getBigInt)(tx.type)) {
                    // If there are no EIP-1559 properties, it might be non-EIP-a559
                    if (tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
                        const feeData = yield this.getFeeData();
                        if (feeData.maxFeePerGas == null && feeData.maxPriorityFeePerGas == null) {
                            // Network doesn't know about EIP-1559 (and hence type)
                            req = Object.assign({}, req, {
                                transaction: Object.assign({}, tx, { type: undefined })
                            });
                        }
                    }
                }
            }
            const request = this.getRpcRequest(req);
            if (request != null) {
                return yield this.send(request.method, request.args);
            }
            return _super._perform.call(this, req);
        });
    }
    /**
     *  Sub-classes may override this; it detects the *actual* network that
     *  we are **currently** connected to.
     *
     *  Keep in mind that [[send]] may only be used once [[ready]], otherwise the
     *  _send primitive must be used instead.
     */
    _detectNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            const network = this._getOption("staticNetwork");
            if (network) {
                if (network === true) {
                    if (__classPrivateFieldGet(this, _JsonRpcApiProvider_network, "f")) {
                        return __classPrivateFieldGet(this, _JsonRpcApiProvider_network, "f");
                    }
                }
                else {
                    return network;
                }
            }
            if (__classPrivateFieldGet(this, _JsonRpcApiProvider_pendingDetectNetwork, "f")) {
                return yield __classPrivateFieldGet(this, _JsonRpcApiProvider_pendingDetectNetwork, "f");
            }
            // If we are ready, use ``send``, which enabled requests to be batched
            if (this.ready) {
                __classPrivateFieldSet(this, _JsonRpcApiProvider_pendingDetectNetwork, (() => __awaiter(this, void 0, void 0, function* () {
                    const result = network_js_1.Network.from((0, index_js_5.getBigInt)(yield this.send("eth_chainId", [])));
                    __classPrivateFieldSet(this, _JsonRpcApiProvider_pendingDetectNetwork, null, "f");
                    return result;
                }))(), "f");
                return yield __classPrivateFieldGet(this, _JsonRpcApiProvider_pendingDetectNetwork, "f");
            }
            // We are not ready yet; use the primitive _send
            __classPrivateFieldSet(this, _JsonRpcApiProvider_pendingDetectNetwork, (() => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const payload = {
                    id: (__classPrivateFieldSet(this, _JsonRpcApiProvider_nextId, (_b = __classPrivateFieldGet(this, _JsonRpcApiProvider_nextId, "f"), _a = _b++, _b), "f"), _a), method: "eth_chainId", params: [], jsonrpc: "2.0"
                };
                this.emit("debug", { action: "sendRpcPayload", payload });
                let result;
                try {
                    result = (yield this._send(payload))[0];
                    __classPrivateFieldSet(this, _JsonRpcApiProvider_pendingDetectNetwork, null, "f");
                }
                catch (error) {
                    __classPrivateFieldSet(this, _JsonRpcApiProvider_pendingDetectNetwork, null, "f");
                    this.emit("debug", { action: "receiveRpcError", error });
                    throw error;
                }
                this.emit("debug", { action: "receiveRpcResult", result });
                if ("result" in result) {
                    return network_js_1.Network.from((0, index_js_5.getBigInt)(result.result));
                }
                throw this.getRpcError(payload, result);
            }))(), "f");
            return yield __classPrivateFieldGet(this, _JsonRpcApiProvider_pendingDetectNetwork, "f");
        });
    }
    /**
     *  Sub-classes **MUST** call this. Until [[_start]] has been called, no calls
     *  will be passed to [[_send]] from [[send]]. If it is overridden, then
     *  ``super._start()`` **MUST** be called.
     *
     *  Calling it multiple times is safe and has no effect.
     */
    _start() {
        if (__classPrivateFieldGet(this, _JsonRpcApiProvider_notReady, "f") == null || __classPrivateFieldGet(this, _JsonRpcApiProvider_notReady, "f").resolve == null) {
            return;
        }
        __classPrivateFieldGet(this, _JsonRpcApiProvider_notReady, "f").resolve();
        __classPrivateFieldSet(this, _JsonRpcApiProvider_notReady, null, "f");
        (() => __awaiter(this, void 0, void 0, function* () {
            // Bootstrap the network
            while (__classPrivateFieldGet(this, _JsonRpcApiProvider_network, "f") == null && !this.destroyed) {
                try {
                    __classPrivateFieldSet(this, _JsonRpcApiProvider_network, yield this._detectNetwork(), "f");
                }
                catch (error) {
                    if (this.destroyed) {
                        break;
                    }
                    console.log("JsonRpcProvider failed to detect network and cannot start up; retry in 1s (perhaps the URL is wrong or the node is not started)");
                    this.emit("error", (0, index_js_5.makeError)("failed to bootstrap network detection", "NETWORK_ERROR", { event: "initial-network-discovery", info: { error } }));
                    yield stall(1000);
                }
            }
            // Start dispatching requests
            __classPrivateFieldGet(this, _JsonRpcApiProvider_instances, "m", _JsonRpcApiProvider_scheduleDrain).call(this);
        }))();
    }
    /**
     *  Resolves once the [[_start]] has been called. This can be used in
     *  sub-classes to defer sending data until the connection has been
     *  established.
     */
    _waitUntilReady() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _JsonRpcApiProvider_notReady, "f") == null) {
                return;
            }
            return yield __classPrivateFieldGet(this, _JsonRpcApiProvider_notReady, "f").promise;
        });
    }
    /**
     *  Return a Subscriber that will manage the %%sub%%.
     *
     *  Sub-classes may override this to modify the behavior of
     *  subscription management.
     */
    _getSubscriber(sub) {
        // Pending Filters aren't availble via polling
        if (sub.type === "pending") {
            return new subscriber_filterid_js_1.FilterIdPendingSubscriber(this);
        }
        if (sub.type === "event") {
            if (this._getOption("polling")) {
                return new subscriber_polling_js_1.PollingEventSubscriber(this, sub.filter);
            }
            return new subscriber_filterid_js_1.FilterIdEventSubscriber(this, sub.filter);
        }
        // Orphaned Logs are handled automatically, by the filter, since
        // logs with removed are emitted by it
        if (sub.type === "orphan" && sub.filter.orphan === "drop-log") {
            return new abstract_provider_js_1.UnmanagedSubscriber("orphan");
        }
        return super._getSubscriber(sub);
    }
    /**
     *  Returns true only if the [[_start]] has been called.
     */
    get ready() { return __classPrivateFieldGet(this, _JsonRpcApiProvider_notReady, "f") == null; }
    /**
     *  Returns %%tx%% as a normalized JSON-RPC transaction request,
     *  which has all values hexlified and any numeric values converted
     *  to Quantity values.
     */
    getRpcTransaction(tx) {
        const result = {};
        // JSON-RPC now requires numeric values to be "quantity" values
        ["chainId", "gasLimit", "gasPrice", "type", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "value"].forEach((key) => {
            if (tx[key] == null) {
                return;
            }
            let dstKey = key;
            if (key === "gasLimit") {
                dstKey = "gas";
            }
            result[dstKey] = (0, index_js_5.toQuantity)((0, index_js_5.getBigInt)(tx[key], `tx.${key}`));
        });
        // Make sure addresses and data are lowercase
        ["from", "to", "data"].forEach((key) => {
            if (tx[key] == null) {
                return;
            }
            result[key] = (0, index_js_5.hexlify)(tx[key]);
        });
        // Normalize the access list object
        if (tx.accessList) {
            result["accessList"] = (0, index_js_4.accessListify)(tx.accessList);
        }
        return result;
    }
    /**
     *  Returns the request method and arguments required to perform
     *  %%req%%.
     */
    getRpcRequest(req) {
        switch (req.method) {
            case "chainId":
                return { method: "eth_chainId", args: [] };
            case "getBlockNumber":
                return { method: "eth_blockNumber", args: [] };
            case "getGasPrice":
                return { method: "eth_gasPrice", args: [] };
            case "getPriorityFee":
                return { method: "eth_maxPriorityFeePerGas", args: [] };
            case "getBalance":
                return {
                    method: "eth_getBalance",
                    args: [getLowerCase(req.address), req.blockTag]
                };
            case "getTransactionCount":
                return {
                    method: "eth_getTransactionCount",
                    args: [getLowerCase(req.address), req.blockTag]
                };
            case "getCode":
                return {
                    method: "eth_getCode",
                    args: [getLowerCase(req.address), req.blockTag]
                };
            case "getStorage":
                return {
                    method: "eth_getStorageAt",
                    args: [
                        getLowerCase(req.address),
                        ("0x" + req.position.toString(16)),
                        req.blockTag
                    ]
                };
            case "broadcastTransaction":
                return {
                    method: "eth_sendRawTransaction",
                    args: [req.signedTransaction]
                };
            case "getBlock":
                if ("blockTag" in req) {
                    return {
                        method: "eth_getBlockByNumber",
                        args: [req.blockTag, !!req.includeTransactions]
                    };
                }
                else if ("blockHash" in req) {
                    return {
                        method: "eth_getBlockByHash",
                        args: [req.blockHash, !!req.includeTransactions]
                    };
                }
                break;
            case "getTransaction":
                return {
                    method: "eth_getTransactionByHash",
                    args: [req.hash]
                };
            case "getTransactionReceipt":
                return {
                    method: "eth_getTransactionReceipt",
                    args: [req.hash]
                };
            case "call":
                return {
                    method: "eth_call",
                    args: [this.getRpcTransaction(req.transaction), req.blockTag]
                };
            case "estimateGas": {
                return {
                    method: "eth_estimateGas",
                    args: [this.getRpcTransaction(req.transaction)]
                };
            }
            case "getLogs":
                if (req.filter && req.filter.address != null) {
                    if (Array.isArray(req.filter.address)) {
                        req.filter.address = req.filter.address.map(getLowerCase);
                    }
                    else {
                        req.filter.address = getLowerCase(req.filter.address);
                    }
                }
                return { method: "eth_getLogs", args: [req.filter] };
        }
        return null;
    }
    /**
     *  Returns an ethers-style Error for the given JSON-RPC error
     *  %%payload%%, coalescing the various strings and error shapes
     *  that different nodes return, coercing them into a machine-readable
     *  standardized error.
     */
    getRpcError(payload, _error) {
        const { method } = payload;
        const { error } = _error;
        if (method === "eth_estimateGas" && error.message) {
            const msg = error.message;
            if (!msg.match(/revert/i) && msg.match(/insufficient funds/i)) {
                return (0, index_js_5.makeError)("insufficient funds", "INSUFFICIENT_FUNDS", {
                    transaction: (payload.params[0]),
                    info: { payload, error }
                });
            }
        }
        if (method === "eth_call" || method === "eth_estimateGas") {
            const result = spelunkData(error);
            const e = index_js_1.AbiCoder.getBuiltinCallException((method === "eth_call") ? "call" : "estimateGas", (payload.params[0]), (result ? result.data : null));
            e.info = { error, payload };
            return e;
        }
        // Only estimateGas and call can return arbitrary contract-defined text, so now we
        // we can process text safely.
        const message = JSON.stringify(spelunkMessage(error));
        if (typeof (error.message) === "string" && error.message.match(/user denied|ethers-user-denied/i)) {
            const actionMap = {
                eth_sign: "signMessage",
                personal_sign: "signMessage",
                eth_signTypedData_v4: "signTypedData",
                eth_signTransaction: "signTransaction",
                eth_sendTransaction: "sendTransaction",
                eth_requestAccounts: "requestAccess",
                wallet_requestAccounts: "requestAccess",
            };
            return (0, index_js_5.makeError)(`user rejected action`, "ACTION_REJECTED", {
                action: (actionMap[method] || "unknown"),
                reason: "rejected",
                info: { payload, error }
            });
        }
        if (method === "eth_sendRawTransaction" || method === "eth_sendTransaction") {
            const transaction = (payload.params[0]);
            if (message.match(/insufficient funds|base fee exceeds gas limit/i)) {
                return (0, index_js_5.makeError)("insufficient funds for intrinsic transaction cost", "INSUFFICIENT_FUNDS", {
                    transaction, info: { error }
                });
            }
            if (message.match(/nonce/i) && message.match(/too low/i)) {
                return (0, index_js_5.makeError)("nonce has already been used", "NONCE_EXPIRED", { transaction, info: { error } });
            }
            // "replacement transaction underpriced"
            if (message.match(/replacement transaction/i) && message.match(/underpriced/i)) {
                return (0, index_js_5.makeError)("replacement fee too low", "REPLACEMENT_UNDERPRICED", { transaction, info: { error } });
            }
            if (message.match(/only replay-protected/i)) {
                return (0, index_js_5.makeError)("legacy pre-eip-155 transactions not supported", "UNSUPPORTED_OPERATION", {
                    operation: method, info: { transaction, info: { error } }
                });
            }
        }
        let unsupported = !!message.match(/the method .* does not exist/i);
        if (!unsupported) {
            if (error && error.details && error.details.startsWith("Unauthorized method:")) {
                unsupported = true;
            }
        }
        if (unsupported) {
            return (0, index_js_5.makeError)("unsupported operation", "UNSUPPORTED_OPERATION", {
                operation: payload.method, info: { error, payload }
            });
        }
        return (0, index_js_5.makeError)("could not coalesce error", "UNKNOWN_ERROR", { error, payload });
    }
    /**
     *  Requests the %%method%% with %%params%% via the JSON-RPC protocol
     *  over the underlying channel. This can be used to call methods
     *  on the backend that do not have a high-level API within the Provider
     *  API.
     *
     *  This method queues requests according to the batch constraints
     *  in the options, assigns the request a unique ID.
     *
     *  **Do NOT override** this method in sub-classes; instead
     *  override [[_send]] or force the options values in the
     *  call to the constructor to modify this method's behavior.
     */
    send(method, params) {
        // @TODO: cache chainId?? purge on switch_networks
        var _a, _b;
        // We have been destroyed; no operations are supported anymore
        if (this.destroyed) {
            return Promise.reject((0, index_js_5.makeError)("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: method }));
        }
        const id = (__classPrivateFieldSet(this, _JsonRpcApiProvider_nextId, (_b = __classPrivateFieldGet(this, _JsonRpcApiProvider_nextId, "f"), _a = _b++, _b), "f"), _a);
        const promise = new Promise((resolve, reject) => {
            __classPrivateFieldGet(this, _JsonRpcApiProvider_payloads, "f").push({
                resolve, reject,
                payload: { method, params, id, jsonrpc: "2.0" }
            });
        });
        // If there is not a pending drainTimer, set one
        __classPrivateFieldGet(this, _JsonRpcApiProvider_instances, "m", _JsonRpcApiProvider_scheduleDrain).call(this);
        return promise;
    }
    /**
     *  Resolves to the [[Signer]] account for  %%address%% managed by
     *  the client.
     *
     *  If the %%address%% is a number, it is used as an index in the
     *  the accounts from [[listAccounts]].
     *
     *  This can only be used on clients which manage accounts (such as
     *  Geth with imported account or MetaMask).
     *
     *  Throws if the account doesn't exist.
     */
    getSigner(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (address == null) {
                address = 0;
            }
            const accountsPromise = this.send("eth_accounts", []);
            // Account index
            if (typeof (address) === "number") {
                const accounts = (yield accountsPromise);
                if (address >= accounts.length) {
                    throw new Error("no such account");
                }
                return new JsonRpcSigner(this, accounts[address]);
            }
            const { accounts } = yield (0, index_js_5.resolveProperties)({
                network: this.getNetwork(),
                accounts: accountsPromise
            });
            // Account address
            address = (0, index_js_2.getAddress)(address);
            for (const account of accounts) {
                if ((0, index_js_2.getAddress)(account) === address) {
                    return new JsonRpcSigner(this, address);
                }
            }
            throw new Error("invalid account");
        });
    }
    listAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.send("eth_accounts", []);
            return accounts.map((a) => new JsonRpcSigner(this, a));
        });
    }
    destroy() {
        // Stop processing requests
        if (__classPrivateFieldGet(this, _JsonRpcApiProvider_drainTimer, "f")) {
            clearTimeout(__classPrivateFieldGet(this, _JsonRpcApiProvider_drainTimer, "f"));
            __classPrivateFieldSet(this, _JsonRpcApiProvider_drainTimer, null, "f");
        }
        // Cancel all pending requests
        for (const { payload, reject } of __classPrivateFieldGet(this, _JsonRpcApiProvider_payloads, "f")) {
            reject((0, index_js_5.makeError)("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: payload.method }));
        }
        __classPrivateFieldSet(this, _JsonRpcApiProvider_payloads, [], "f");
        // Parent clean-up
        super.destroy();
    }
}
exports.JsonRpcApiProvider = JsonRpcApiProvider;
_JsonRpcApiProvider_options = new WeakMap(), _JsonRpcApiProvider_nextId = new WeakMap(), _JsonRpcApiProvider_payloads = new WeakMap(), _JsonRpcApiProvider_drainTimer = new WeakMap(), _JsonRpcApiProvider_notReady = new WeakMap(), _JsonRpcApiProvider_network = new WeakMap(), _JsonRpcApiProvider_pendingDetectNetwork = new WeakMap(), _JsonRpcApiProvider_instances = new WeakSet(), _JsonRpcApiProvider_scheduleDrain = function _JsonRpcApiProvider_scheduleDrain() {
    if (__classPrivateFieldGet(this, _JsonRpcApiProvider_drainTimer, "f")) {
        return;
    }
    // If we aren't using batching, no hard in sending it immeidately
    const stallTime = (this._getOption("batchMaxCount") === 1) ? 0 : this._getOption("batchStallTime");
    __classPrivateFieldSet(this, _JsonRpcApiProvider_drainTimer, setTimeout(() => {
        __classPrivateFieldSet(this, _JsonRpcApiProvider_drainTimer, null, "f");
        const payloads = __classPrivateFieldGet(this, _JsonRpcApiProvider_payloads, "f");
        __classPrivateFieldSet(this, _JsonRpcApiProvider_payloads, [], "f");
        while (payloads.length) {
            // Create payload batches that satisfy our batch constraints
            const batch = [(payloads.shift())];
            while (payloads.length) {
                if (batch.length === __classPrivateFieldGet(this, _JsonRpcApiProvider_options, "f").batchMaxCount) {
                    break;
                }
                batch.push((payloads.shift()));
                const bytes = JSON.stringify(batch.map((p) => p.payload));
                if (bytes.length > __classPrivateFieldGet(this, _JsonRpcApiProvider_options, "f").batchMaxSize) {
                    payloads.unshift((batch.pop()));
                    break;
                }
            }
            // Process the result to each payload
            (() => __awaiter(this, void 0, void 0, function* () {
                const payload = ((batch.length === 1) ? batch[0].payload : batch.map((p) => p.payload));
                this.emit("debug", { action: "sendRpcPayload", payload });
                try {
                    const result = yield this._send(payload);
                    this.emit("debug", { action: "receiveRpcResult", result });
                    // Process results in batch order
                    for (const { resolve, reject, payload } of batch) {
                        if (this.destroyed) {
                            reject((0, index_js_5.makeError)("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: payload.method }));
                            continue;
                        }
                        // Find the matching result
                        const resp = result.filter((r) => (r.id === payload.id))[0];
                        // No result; the node failed us in unexpected ways
                        if (resp == null) {
                            const error = (0, index_js_5.makeError)("missing response for request", "BAD_DATA", {
                                value: result, info: { payload }
                            });
                            this.emit("error", error);
                            reject(error);
                            continue;
                        }
                        // The response is an error
                        if ("error" in resp) {
                            reject(this.getRpcError(payload, resp));
                            continue;
                        }
                        // All good; send the result
                        resolve(resp.result);
                    }
                }
                catch (error) {
                    this.emit("debug", { action: "receiveRpcError", error });
                    for (const { reject } of batch) {
                        // @TODO: augment the error with the payload
                        reject(error);
                    }
                }
            }))();
        }
    }, stallTime), "f");
};
// @TODO: remove this in v7, it is not exported because this functionality
// is exposed in the JsonRpcApiProvider by setting polling to true. It should
// be safe to remove regardless, because it isn't reachable, but just in case.
/**
 *  @_ignore:
 */
class JsonRpcApiPollingProvider extends JsonRpcApiProvider {
    constructor(network, options) {
        super(network, options);
        _JsonRpcApiPollingProvider_pollingInterval.set(this, void 0);
        __classPrivateFieldSet(this, _JsonRpcApiPollingProvider_pollingInterval, 4000, "f");
    }
    _getSubscriber(sub) {
        const subscriber = super._getSubscriber(sub);
        if (isPollable(subscriber)) {
            subscriber.pollingInterval = __classPrivateFieldGet(this, _JsonRpcApiPollingProvider_pollingInterval, "f");
        }
        return subscriber;
    }
    /**
     *  The polling interval (default: 4000 ms)
     */
    get pollingInterval() { return __classPrivateFieldGet(this, _JsonRpcApiPollingProvider_pollingInterval, "f"); }
    set pollingInterval(value) {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error("invalid interval");
        }
        __classPrivateFieldSet(this, _JsonRpcApiPollingProvider_pollingInterval, value, "f");
        this._forEachSubscriber((sub) => {
            if (isPollable(sub)) {
                sub.pollingInterval = __classPrivateFieldGet(this, _JsonRpcApiPollingProvider_pollingInterval, "f");
            }
        });
    }
}
exports.JsonRpcApiPollingProvider = JsonRpcApiPollingProvider;
_JsonRpcApiPollingProvider_pollingInterval = new WeakMap();
/**
 *  The JsonRpcProvider is one of the most common Providers,
 *  which performs all operations over HTTP (or HTTPS) requests.
 *
 *  Events are processed by polling the backend for the current block
 *  number; when it advances, all block-base events are then checked
 *  for updates.
 */
class JsonRpcProvider extends JsonRpcApiPollingProvider {
    constructor(url, network, options) {
        if (url == null) {
            url = "http:/\/localhost:8545";
        }
        super(network, options);
        _JsonRpcProvider_connect.set(this, void 0);
        if (typeof (url) === "string") {
            __classPrivateFieldSet(this, _JsonRpcProvider_connect, new index_js_5.FetchRequest(url), "f");
        }
        else {
            __classPrivateFieldSet(this, _JsonRpcProvider_connect, url.clone(), "f");
        }
    }
    _getConnection() {
        return __classPrivateFieldGet(this, _JsonRpcProvider_connect, "f").clone();
    }
    send(method, params) {
        const _super = Object.create(null, {
            send: { get: () => super.send }
        });
        return __awaiter(this, void 0, void 0, function* () {
            // All requests are over HTTP, so we can just start handling requests
            // We do this here rather than the constructor so that we don't send any
            // requests to the network (i.e. eth_chainId) until we absolutely have to.
            yield this._start();
            return yield _super.send.call(this, method, params);
        });
    }
    _send(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // Configure a POST connection for the requested method
            const request = this._getConnection();
            request.body = JSON.stringify(payload);
            request.setHeader("content-type", "application/json");
            const response = yield request.send();
            response.assertOk();
            let resp = response.bodyJson;
            if (!Array.isArray(resp)) {
                resp = [resp];
            }
            return resp;
        });
    }
}
exports.JsonRpcProvider = JsonRpcProvider;
_JsonRpcProvider_connect = new WeakMap();
function spelunkData(value) {
    if (value == null) {
        return null;
    }
    // These *are* the droids we're looking for.
    if (typeof (value.message) === "string" && value.message.match(/revert/i) && (0, index_js_5.isHexString)(value.data)) {
        return { message: value.message, data: value.data };
    }
    // Spelunk further...
    if (typeof (value) === "object") {
        for (const key in value) {
            const result = spelunkData(value[key]);
            if (result) {
                return result;
            }
        }
        return null;
    }
    // Might be a JSON string we can further descend...
    if (typeof (value) === "string") {
        try {
            return spelunkData(JSON.parse(value));
        }
        catch (error) { }
    }
    return null;
}
function _spelunkMessage(value, result) {
    if (value == null) {
        return;
    }
    // These *are* the droids we're looking for.
    if (typeof (value.message) === "string") {
        result.push(value.message);
    }
    // Spelunk further...
    if (typeof (value) === "object") {
        for (const key in value) {
            _spelunkMessage(value[key], result);
        }
    }
    // Might be a JSON string we can further descend...
    if (typeof (value) === "string") {
        try {
            return _spelunkMessage(JSON.parse(value), result);
        }
        catch (error) { }
    }
}
function spelunkMessage(value) {
    const result = [];
    _spelunkMessage(value, result);
    return result;
}
//# sourceMappingURL=provider-jsonrpc.js.map
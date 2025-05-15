"use strict";
/**
 *  The available providers should suffice for most developers purposes,
 *  but the [[AbstractProvider]] class has many features which enable
 *  sub-classing it for specific purposes.
 *
 *  @_section: api/providers/abstract-provider: Subclassing Provider  [abstract-provider]
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
var _AbstractProvider_instances, _AbstractProvider_subs, _AbstractProvider_plugins, _AbstractProvider_pausedState, _AbstractProvider_destroyed, _AbstractProvider_networkPromise, _AbstractProvider_anyNetwork, _AbstractProvider_performCache, _AbstractProvider_lastBlockNumber, _AbstractProvider_nextTimer, _AbstractProvider_timers, _AbstractProvider_disableCcipRead, _AbstractProvider_options, _AbstractProvider_perform, _AbstractProvider_call, _AbstractProvider_checkNetwork, _AbstractProvider_getAccountValue, _AbstractProvider_getBlock, _AbstractProvider_hasSub, _AbstractProvider_getSub;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractProvider = exports.UnmanagedSubscriber = void 0;
// @TODO
// Event coalescence
//   When we register an event with an async value (e.g. address is a Signer
//   or ENS name), we need to add it immeidately for the Event API, but also
//   need time to resolve the address. Upon resolving the address, we need to
//   migrate the listener to the static event. We also need to maintain a map
//   of Signer/ENS name to address so we can sync respond to listenerCount.
const index_js_1 = require("../address/index.js");
const index_js_2 = require("../constants/index.js");
const index_js_3 = require("../contract/index.js");
const index_js_4 = require("../hash/index.js");
const index_js_5 = require("../transaction/index.js");
const index_js_6 = require("../utils/index.js");
const ens_resolver_js_1 = require("./ens-resolver.js");
const format_js_1 = require("./format.js");
const network_js_1 = require("./network.js");
const provider_js_1 = require("./provider.js");
const subscriber_polling_js_1 = require("./subscriber-polling.js");
// Constants
const BN_2 = BigInt(2);
const MAX_CCIP_REDIRECTS = 10;
function isPromise(value) {
    return (value && typeof (value.then) === "function");
}
function getTag(prefix, value) {
    return prefix + ":" + JSON.stringify(value, (k, v) => {
        if (v == null) {
            return "null";
        }
        if (typeof (v) === "bigint") {
            return `bigint:${v.toString()}`;
        }
        if (typeof (v) === "string") {
            return v.toLowerCase();
        }
        // Sort object keys
        if (typeof (v) === "object" && !Array.isArray(v)) {
            const keys = Object.keys(v);
            keys.sort();
            return keys.reduce((accum, key) => {
                accum[key] = v[key];
                return accum;
            }, {});
        }
        return v;
    });
}
/**
 *  An **UnmanagedSubscriber** is useful for events which do not require
 *  any additional management, such as ``"debug"`` which only requires
 *  emit in synchronous event loop triggered calls.
 */
class UnmanagedSubscriber {
    /**
     *  Create a new UnmanagedSubscriber with %%name%%.
     */
    constructor(name) { (0, index_js_6.defineProperties)(this, { name }); }
    start() { }
    stop() { }
    pause(dropWhilePaused) { }
    resume() { }
}
exports.UnmanagedSubscriber = UnmanagedSubscriber;
function copy(value) {
    return JSON.parse(JSON.stringify(value));
}
function concisify(items) {
    items = Array.from((new Set(items)).values());
    items.sort();
    return items;
}
function getSubscription(_event, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_event == null) {
            throw new Error("invalid event");
        }
        // Normalize topic array info an EventFilter
        if (Array.isArray(_event)) {
            _event = { topics: _event };
        }
        if (typeof (_event) === "string") {
            switch (_event) {
                case "block":
                case "debug":
                case "error":
                case "finalized":
                case "network":
                case "pending":
                case "safe": {
                    return { type: _event, tag: _event };
                }
            }
        }
        if ((0, index_js_6.isHexString)(_event, 32)) {
            const hash = _event.toLowerCase();
            return { type: "transaction", tag: getTag("tx", { hash }), hash };
        }
        if (_event.orphan) {
            const event = _event;
            // @TODO: Should lowercase and whatnot things here instead of copy...
            return { type: "orphan", tag: getTag("orphan", event), filter: copy(event) };
        }
        if ((_event.address || _event.topics)) {
            const event = _event;
            const filter = {
                topics: ((event.topics || []).map((t) => {
                    if (t == null) {
                        return null;
                    }
                    if (Array.isArray(t)) {
                        return concisify(t.map((t) => t.toLowerCase()));
                    }
                    return t.toLowerCase();
                }))
            };
            if (event.address) {
                const addresses = [];
                const promises = [];
                const addAddress = (addr) => {
                    if ((0, index_js_6.isHexString)(addr)) {
                        addresses.push(addr);
                    }
                    else {
                        promises.push((() => __awaiter(this, void 0, void 0, function* () {
                            addresses.push(yield (0, index_js_1.resolveAddress)(addr, provider));
                        }))());
                    }
                };
                if (Array.isArray(event.address)) {
                    event.address.forEach(addAddress);
                }
                else {
                    addAddress(event.address);
                }
                if (promises.length) {
                    yield Promise.all(promises);
                }
                filter.address = concisify(addresses.map((a) => a.toLowerCase()));
            }
            return { filter, tag: getTag("event", filter), type: "event" };
        }
        (0, index_js_6.assertArgument)(false, "unknown ProviderEvent", "event", _event);
    });
}
function getTime() { return (new Date()).getTime(); }
const defaultOptions = {
    cacheTimeout: 250,
    pollingInterval: 4000
};
/**
 *  An **AbstractProvider** provides a base class for other sub-classes to
 *  implement the [[Provider]] API by normalizing input arguments and
 *  formatting output results as well as tracking events for consistent
 *  behaviour on an eventually-consistent network.
 */
class AbstractProvider {
    /**
     *  Create a new **AbstractProvider** connected to %%network%%, or
     *  use the various network detection capabilities to discover the
     *  [[Network]] if necessary.
     */
    constructor(_network, options) {
        _AbstractProvider_instances.add(this);
        _AbstractProvider_subs.set(this, void 0);
        _AbstractProvider_plugins.set(this, void 0);
        // null=unpaused, true=paused+dropWhilePaused, false=paused
        _AbstractProvider_pausedState.set(this, void 0);
        _AbstractProvider_destroyed.set(this, void 0);
        _AbstractProvider_networkPromise.set(this, void 0);
        _AbstractProvider_anyNetwork.set(this, void 0);
        _AbstractProvider_performCache.set(this, void 0);
        // The most recent block number if running an event or -1 if no "block" event
        _AbstractProvider_lastBlockNumber.set(this, void 0);
        _AbstractProvider_nextTimer.set(this, void 0);
        _AbstractProvider_timers.set(this, void 0);
        _AbstractProvider_disableCcipRead.set(this, void 0);
        _AbstractProvider_options.set(this, void 0);
        __classPrivateFieldSet(this, _AbstractProvider_options, Object.assign({}, defaultOptions, options || {}), "f");
        if (_network === "any") {
            __classPrivateFieldSet(this, _AbstractProvider_anyNetwork, true, "f");
            __classPrivateFieldSet(this, _AbstractProvider_networkPromise, null, "f");
        }
        else if (_network) {
            const network = network_js_1.Network.from(_network);
            __classPrivateFieldSet(this, _AbstractProvider_anyNetwork, false, "f");
            __classPrivateFieldSet(this, _AbstractProvider_networkPromise, Promise.resolve(network), "f");
            setTimeout(() => { this.emit("network", network, null); }, 0);
        }
        else {
            __classPrivateFieldSet(this, _AbstractProvider_anyNetwork, false, "f");
            __classPrivateFieldSet(this, _AbstractProvider_networkPromise, null, "f");
        }
        __classPrivateFieldSet(this, _AbstractProvider_lastBlockNumber, -1, "f");
        __classPrivateFieldSet(this, _AbstractProvider_performCache, new Map(), "f");
        __classPrivateFieldSet(this, _AbstractProvider_subs, new Map(), "f");
        __classPrivateFieldSet(this, _AbstractProvider_plugins, new Map(), "f");
        __classPrivateFieldSet(this, _AbstractProvider_pausedState, null, "f");
        __classPrivateFieldSet(this, _AbstractProvider_destroyed, false, "f");
        __classPrivateFieldSet(this, _AbstractProvider_nextTimer, 1, "f");
        __classPrivateFieldSet(this, _AbstractProvider_timers, new Map(), "f");
        __classPrivateFieldSet(this, _AbstractProvider_disableCcipRead, false, "f");
    }
    get pollingInterval() { return __classPrivateFieldGet(this, _AbstractProvider_options, "f").pollingInterval; }
    /**
     *  Returns ``this``, to allow an **AbstractProvider** to implement
     *  the [[ContractRunner]] interface.
     */
    get provider() { return this; }
    /**
     *  Returns all the registered plug-ins.
     */
    get plugins() {
        return Array.from(__classPrivateFieldGet(this, _AbstractProvider_plugins, "f").values());
    }
    /**
     *  Attach a new plug-in.
     */
    attachPlugin(plugin) {
        if (__classPrivateFieldGet(this, _AbstractProvider_plugins, "f").get(plugin.name)) {
            throw new Error(`cannot replace existing plugin: ${plugin.name} `);
        }
        __classPrivateFieldGet(this, _AbstractProvider_plugins, "f").set(plugin.name, plugin.connect(this));
        return this;
    }
    /**
     *  Get a plugin by name.
     */
    getPlugin(name) {
        return (__classPrivateFieldGet(this, _AbstractProvider_plugins, "f").get(name)) || null;
    }
    /**
     *  Prevent any CCIP-read operation, regardless of whether requested
     *  in a [[call]] using ``enableCcipRead``.
     */
    get disableCcipRead() { return __classPrivateFieldGet(this, _AbstractProvider_disableCcipRead, "f"); }
    set disableCcipRead(value) { __classPrivateFieldSet(this, _AbstractProvider_disableCcipRead, !!value, "f"); }
    /**
     *  Resolves to the data for executing the CCIP-read operations.
     */
    ccipReadFetch(tx, calldata, urls) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.disableCcipRead || urls.length === 0 || tx.to == null) {
                return null;
            }
            const sender = tx.to.toLowerCase();
            const data = calldata.toLowerCase();
            const errorMessages = [];
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                // URL expansion
                const href = url.replace("{sender}", sender).replace("{data}", data);
                // If no {data} is present, use POST; otherwise GET
                //const json: string | null = (url.indexOf("{data}") >= 0) ? null: JSON.stringify({ data, sender });
                //const result = await fetchJson({ url: href, errorPassThrough: true }, json, (value, response) => {
                //    value.status = response.statusCode;
                //    return value;
                //});
                const request = new index_js_6.FetchRequest(href);
                if (url.indexOf("{data}") === -1) {
                    request.body = { data, sender };
                }
                this.emit("debug", { action: "sendCcipReadFetchRequest", request, index: i, urls });
                let errorMessage = "unknown error";
                const resp = yield request.send();
                try {
                    const result = resp.bodyJson;
                    if (result.data) {
                        this.emit("debug", { action: "receiveCcipReadFetchResult", request, result });
                        return result.data;
                    }
                    if (result.message) {
                        errorMessage = result.message;
                    }
                    this.emit("debug", { action: "receiveCcipReadFetchError", request, result });
                }
                catch (error) { }
                // 4xx indicates the result is not present; stop
                (0, index_js_6.assert)(resp.statusCode < 400 || resp.statusCode >= 500, `response not found during CCIP fetch: ${errorMessage}`, "OFFCHAIN_FAULT", { reason: "404_MISSING_RESOURCE", transaction: tx, info: { url, errorMessage } });
                // 5xx indicates server issue; try the next url
                errorMessages.push(errorMessage);
            }
            (0, index_js_6.assert)(false, `error encountered during CCIP fetch: ${errorMessages.map((m) => JSON.stringify(m)).join(", ")}`, "OFFCHAIN_FAULT", {
                reason: "500_SERVER_ERROR",
                transaction: tx, info: { urls, errorMessages }
            });
        });
    }
    /**
     *  Provides the opportunity for a sub-class to wrap a block before
     *  returning it, to add additional properties or an alternate
     *  sub-class of [[Block]].
     */
    _wrapBlock(value, network) {
        return new provider_js_1.Block((0, format_js_1.formatBlock)(value), this);
    }
    /**
     *  Provides the opportunity for a sub-class to wrap a log before
     *  returning it, to add additional properties or an alternate
     *  sub-class of [[Log]].
     */
    _wrapLog(value, network) {
        return new provider_js_1.Log((0, format_js_1.formatLog)(value), this);
    }
    /**
     *  Provides the opportunity for a sub-class to wrap a transaction
     *  receipt before returning it, to add additional properties or an
     *  alternate sub-class of [[TransactionReceipt]].
     */
    _wrapTransactionReceipt(value, network) {
        return new provider_js_1.TransactionReceipt((0, format_js_1.formatTransactionReceipt)(value), this);
    }
    /**
     *  Provides the opportunity for a sub-class to wrap a transaction
     *  response before returning it, to add additional properties or an
     *  alternate sub-class of [[TransactionResponse]].
     */
    _wrapTransactionResponse(tx, network) {
        return new provider_js_1.TransactionResponse((0, format_js_1.formatTransactionResponse)(tx), this);
    }
    /**
     *  Resolves to the Network, forcing a network detection using whatever
     *  technique the sub-class requires.
     *
     *  Sub-classes **must** override this.
     */
    _detectNetwork() {
        (0, index_js_6.assert)(false, "sub-classes must implement this", "UNSUPPORTED_OPERATION", {
            operation: "_detectNetwork"
        });
    }
    /**
     *  Sub-classes should use this to perform all built-in operations. All
     *  methods sanitizes and normalizes the values passed into this.
     *
     *  Sub-classes **must** override this.
     */
    _perform(req) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, index_js_6.assert)(false, `unsupported method: ${req.method}`, "UNSUPPORTED_OPERATION", {
                operation: req.method,
                info: req
            });
        });
    }
    // State
    getBlockNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            const blockNumber = (0, index_js_6.getNumber)(yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, { method: "getBlockNumber" }), "%response");
            if (__classPrivateFieldGet(this, _AbstractProvider_lastBlockNumber, "f") >= 0) {
                __classPrivateFieldSet(this, _AbstractProvider_lastBlockNumber, blockNumber, "f");
            }
            return blockNumber;
        });
    }
    /**
     *  Returns or resolves to the address for %%address%%, resolving ENS
     *  names and [[Addressable]] objects and returning if already an
     *  address.
     */
    _getAddress(address) {
        return (0, index_js_1.resolveAddress)(address, this);
    }
    /**
     *  Returns or resolves to a valid block tag for %%blockTag%%, resolving
     *  negative values and returning if already a valid block tag.
     */
    _getBlockTag(blockTag) {
        if (blockTag == null) {
            return "latest";
        }
        switch (blockTag) {
            case "earliest":
                return "0x0";
            case "finalized":
            case "latest":
            case "pending":
            case "safe":
                return blockTag;
        }
        if ((0, index_js_6.isHexString)(blockTag)) {
            if ((0, index_js_6.isHexString)(blockTag, 32)) {
                return blockTag;
            }
            return (0, index_js_6.toQuantity)(blockTag);
        }
        if (typeof (blockTag) === "bigint") {
            blockTag = (0, index_js_6.getNumber)(blockTag, "blockTag");
        }
        if (typeof (blockTag) === "number") {
            if (blockTag >= 0) {
                return (0, index_js_6.toQuantity)(blockTag);
            }
            if (__classPrivateFieldGet(this, _AbstractProvider_lastBlockNumber, "f") >= 0) {
                return (0, index_js_6.toQuantity)(__classPrivateFieldGet(this, _AbstractProvider_lastBlockNumber, "f") + blockTag);
            }
            return this.getBlockNumber().then((b) => (0, index_js_6.toQuantity)(b + blockTag));
        }
        (0, index_js_6.assertArgument)(false, "invalid blockTag", "blockTag", blockTag);
    }
    /**
     *  Returns or resolves to a filter for %%filter%%, resolving any ENS
     *  names or [[Addressable]] object and returning if already a valid
     *  filter.
     */
    _getFilter(filter) {
        // Create a canonical representation of the topics
        const topics = (filter.topics || []).map((t) => {
            if (t == null) {
                return null;
            }
            if (Array.isArray(t)) {
                return concisify(t.map((t) => t.toLowerCase()));
            }
            return t.toLowerCase();
        });
        const blockHash = ("blockHash" in filter) ? filter.blockHash : undefined;
        const resolve = (_address, fromBlock, toBlock) => {
            let address = undefined;
            switch (_address.length) {
                case 0: break;
                case 1:
                    address = _address[0];
                    break;
                default:
                    _address.sort();
                    address = _address;
            }
            if (blockHash) {
                if (fromBlock != null || toBlock != null) {
                    throw new Error("invalid filter");
                }
            }
            const filter = {};
            if (address) {
                filter.address = address;
            }
            if (topics.length) {
                filter.topics = topics;
            }
            if (fromBlock) {
                filter.fromBlock = fromBlock;
            }
            if (toBlock) {
                filter.toBlock = toBlock;
            }
            if (blockHash) {
                filter.blockHash = blockHash;
            }
            return filter;
        };
        // Addresses could be async (ENS names or Addressables)
        let address = [];
        if (filter.address) {
            if (Array.isArray(filter.address)) {
                for (const addr of filter.address) {
                    address.push(this._getAddress(addr));
                }
            }
            else {
                address.push(this._getAddress(filter.address));
            }
        }
        let fromBlock = undefined;
        if ("fromBlock" in filter) {
            fromBlock = this._getBlockTag(filter.fromBlock);
        }
        let toBlock = undefined;
        if ("toBlock" in filter) {
            toBlock = this._getBlockTag(filter.toBlock);
        }
        if (address.filter((a) => (typeof (a) !== "string")).length ||
            (fromBlock != null && typeof (fromBlock) !== "string") ||
            (toBlock != null && typeof (toBlock) !== "string")) {
            return Promise.all([Promise.all(address), fromBlock, toBlock]).then((result) => {
                return resolve(result[0], result[1], result[2]);
            });
        }
        return resolve(address, fromBlock, toBlock);
    }
    /**
     *  Returns or resovles to a transaction for %%request%%, resolving
     *  any ENS names or [[Addressable]] and returning if already a valid
     *  transaction.
     */
    _getTransactionRequest(_request) {
        const request = (0, provider_js_1.copyRequest)(_request);
        const promises = [];
        ["to", "from"].forEach((key) => {
            if (request[key] == null) {
                return;
            }
            const addr = (0, index_js_1.resolveAddress)(request[key], this);
            if (isPromise(addr)) {
                promises.push((function () {
                    return __awaiter(this, void 0, void 0, function* () { request[key] = yield addr; });
                })());
            }
            else {
                request[key] = addr;
            }
        });
        if (request.blockTag != null) {
            const blockTag = this._getBlockTag(request.blockTag);
            if (isPromise(blockTag)) {
                promises.push((function () {
                    return __awaiter(this, void 0, void 0, function* () { request.blockTag = yield blockTag; });
                })());
            }
            else {
                request.blockTag = blockTag;
            }
        }
        if (promises.length) {
            return (function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield Promise.all(promises);
                    return request;
                });
            })();
        }
        return request;
    }
    getNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            // No explicit network was set and this is our first time
            if (__classPrivateFieldGet(this, _AbstractProvider_networkPromise, "f") == null) {
                // Detect the current network (shared with all calls)
                const detectNetwork = this._detectNetwork().then((network) => {
                    this.emit("network", network, null);
                    return network;
                }, (error) => {
                    // Reset the networkPromise on failure, so we will try again
                    if (__classPrivateFieldGet(this, _AbstractProvider_networkPromise, "f") === detectNetwork) {
                        __classPrivateFieldSet(this, _AbstractProvider_networkPromise, null, "f");
                    }
                    throw error;
                });
                __classPrivateFieldSet(this, _AbstractProvider_networkPromise, detectNetwork, "f");
                return (yield detectNetwork).clone();
            }
            const networkPromise = __classPrivateFieldGet(this, _AbstractProvider_networkPromise, "f");
            const [expected, actual] = yield Promise.all([
                networkPromise,
                this._detectNetwork() // The actual connected network
            ]);
            if (expected.chainId !== actual.chainId) {
                if (__classPrivateFieldGet(this, _AbstractProvider_anyNetwork, "f")) {
                    // The "any" network can change, so notify listeners
                    this.emit("network", actual, expected);
                    // Update the network if something else hasn't already changed it
                    if (__classPrivateFieldGet(this, _AbstractProvider_networkPromise, "f") === networkPromise) {
                        __classPrivateFieldSet(this, _AbstractProvider_networkPromise, Promise.resolve(actual), "f");
                    }
                }
                else {
                    // Otherwise, we do not allow changes to the underlying network
                    (0, index_js_6.assert)(false, `network changed: ${expected.chainId} => ${actual.chainId} `, "NETWORK_ERROR", {
                        event: "changed"
                    });
                }
            }
            return expected.clone();
        });
    }
    getFeeData() {
        return __awaiter(this, void 0, void 0, function* () {
            const network = yield this.getNetwork();
            const getFeeDataFunc = () => __awaiter(this, void 0, void 0, function* () {
                const { _block, gasPrice, priorityFee } = yield (0, index_js_6.resolveProperties)({
                    _block: __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getBlock).call(this, "latest", false),
                    gasPrice: ((() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const value = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, { method: "getGasPrice" });
                            return (0, index_js_6.getBigInt)(value, "%response");
                        }
                        catch (error) { }
                        return null;
                    }))()),
                    priorityFee: ((() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const value = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, { method: "getPriorityFee" });
                            return (0, index_js_6.getBigInt)(value, "%response");
                        }
                        catch (error) { }
                        return null;
                    }))())
                });
                let maxFeePerGas = null;
                let maxPriorityFeePerGas = null;
                // These are the recommended EIP-1559 heuristics for fee data
                const block = this._wrapBlock(_block, network);
                if (block && block.baseFeePerGas) {
                    maxPriorityFeePerGas = (priorityFee != null) ? priorityFee : BigInt("1000000000");
                    maxFeePerGas = (block.baseFeePerGas * BN_2) + maxPriorityFeePerGas;
                }
                return new provider_js_1.FeeData(gasPrice, maxFeePerGas, maxPriorityFeePerGas);
            });
            // Check for a FeeDataNetWorkPlugin
            const plugin = network.getPlugin("org.ethers.plugins.network.FetchUrlFeeDataPlugin");
            if (plugin) {
                const req = new index_js_6.FetchRequest(plugin.url);
                const feeData = yield plugin.processFunc(getFeeDataFunc, this, req);
                return new provider_js_1.FeeData(feeData.gasPrice, feeData.maxFeePerGas, feeData.maxPriorityFeePerGas);
            }
            return yield getFeeDataFunc();
        });
    }
    estimateGas(_tx) {
        return __awaiter(this, void 0, void 0, function* () {
            let tx = this._getTransactionRequest(_tx);
            if (isPromise(tx)) {
                tx = yield tx;
            }
            return (0, index_js_6.getBigInt)(yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, {
                method: "estimateGas", transaction: tx
            }), "%response");
        });
    }
    call(_tx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tx, blockTag } = yield (0, index_js_6.resolveProperties)({
                tx: this._getTransactionRequest(_tx),
                blockTag: this._getBlockTag(_tx.blockTag)
            });
            return yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_checkNetwork).call(this, __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_call).call(this, tx, blockTag, _tx.enableCcipRead ? 0 : -1));
        });
    }
    getBalance(address, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, index_js_6.getBigInt)(yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getAccountValue).call(this, { method: "getBalance" }, address, blockTag), "%response");
        });
    }
    getTransactionCount(address, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, index_js_6.getNumber)(yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getAccountValue).call(this, { method: "getTransactionCount" }, address, blockTag), "%response");
        });
    }
    getCode(address, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, index_js_6.hexlify)(yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getAccountValue).call(this, { method: "getCode" }, address, blockTag));
        });
    }
    getStorage(address, _position, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            const position = (0, index_js_6.getBigInt)(_position, "position");
            return (0, index_js_6.hexlify)(yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getAccountValue).call(this, { method: "getStorage", position }, address, blockTag));
        });
    }
    // Write
    broadcastTransaction(signedTx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { blockNumber, hash, network } = yield (0, index_js_6.resolveProperties)({
                blockNumber: this.getBlockNumber(),
                hash: this._perform({
                    method: "broadcastTransaction",
                    signedTransaction: signedTx
                }),
                network: this.getNetwork()
            });
            const tx = index_js_5.Transaction.from(signedTx);
            if (tx.hash !== hash) {
                throw new Error("@TODO: the returned hash did not match");
            }
            return this._wrapTransactionResponse(tx, network).replaceableTransaction(blockNumber);
        });
    }
    // Queries
    getBlock(block, prefetchTxs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { network, params } = yield (0, index_js_6.resolveProperties)({
                network: this.getNetwork(),
                params: __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getBlock).call(this, block, !!prefetchTxs)
            });
            if (params == null) {
                return null;
            }
            return this._wrapBlock(params, network);
        });
    }
    getTransaction(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const { network, params } = yield (0, index_js_6.resolveProperties)({
                network: this.getNetwork(),
                params: __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, { method: "getTransaction", hash })
            });
            if (params == null) {
                return null;
            }
            return this._wrapTransactionResponse(params, network);
        });
    }
    getTransactionReceipt(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const { network, params } = yield (0, index_js_6.resolveProperties)({
                network: this.getNetwork(),
                params: __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, { method: "getTransactionReceipt", hash })
            });
            if (params == null) {
                return null;
            }
            // Some backends did not backfill the effectiveGasPrice into old transactions
            // in the receipt, so we look it up manually and inject it.
            if (params.gasPrice == null && params.effectiveGasPrice == null) {
                const tx = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, { method: "getTransaction", hash });
                if (tx == null) {
                    throw new Error("report this; could not find tx or effectiveGasPrice");
                }
                params.effectiveGasPrice = tx.gasPrice;
            }
            return this._wrapTransactionReceipt(params, network);
        });
    }
    getTransactionResult(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const { result } = yield (0, index_js_6.resolveProperties)({
                network: this.getNetwork(),
                result: __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, { method: "getTransactionResult", hash })
            });
            if (result == null) {
                return null;
            }
            return (0, index_js_6.hexlify)(result);
        });
    }
    // Bloom-filter Queries
    getLogs(_filter) {
        return __awaiter(this, void 0, void 0, function* () {
            let filter = this._getFilter(_filter);
            if (isPromise(filter)) {
                filter = yield filter;
            }
            const { network, params } = yield (0, index_js_6.resolveProperties)({
                network: this.getNetwork(),
                params: __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, { method: "getLogs", filter })
            });
            return params.map((p) => this._wrapLog(p, network));
        });
    }
    // ENS
    _getProvider(chainId) {
        (0, index_js_6.assert)(false, "provider cannot connect to target network", "UNSUPPORTED_OPERATION", {
            operation: "_getProvider()"
        });
    }
    getResolver(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield ens_resolver_js_1.EnsResolver.fromName(this, name);
        });
    }
    getAvatar(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolver = yield this.getResolver(name);
            if (resolver) {
                return yield resolver.getAvatar();
            }
            return null;
        });
    }
    resolveName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolver = yield this.getResolver(name);
            if (resolver) {
                return yield resolver.getAddress();
            }
            return null;
        });
    }
    lookupAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            address = (0, index_js_1.getAddress)(address);
            const node = (0, index_js_4.namehash)(address.substring(2).toLowerCase() + ".addr.reverse");
            try {
                const ensAddr = yield ens_resolver_js_1.EnsResolver.getEnsAddress(this);
                const ensContract = new index_js_3.Contract(ensAddr, [
                    "function resolver(bytes32) view returns (address)"
                ], this);
                const resolver = yield ensContract.resolver(node);
                if (resolver == null || resolver === index_js_2.ZeroAddress) {
                    return null;
                }
                const resolverContract = new index_js_3.Contract(resolver, [
                    "function name(bytes32) view returns (string)"
                ], this);
                const name = yield resolverContract.name(node);
                // Failed forward resolution
                const check = yield this.resolveName(name);
                if (check !== address) {
                    return null;
                }
                return name;
            }
            catch (error) {
                // No data was returned from the resolver
                if ((0, index_js_6.isError)(error, "BAD_DATA") && error.value === "0x") {
                    return null;
                }
                // Something reerted
                if ((0, index_js_6.isError)(error, "CALL_EXCEPTION")) {
                    return null;
                }
                throw error;
            }
            return null;
        });
    }
    waitForTransaction(hash, _confirms, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const confirms = (_confirms != null) ? _confirms : 1;
            if (confirms === 0) {
                return this.getTransactionReceipt(hash);
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let timer = null;
                const listener = ((blockNumber) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const receipt = yield this.getTransactionReceipt(hash);
                        if (receipt != null) {
                            if (blockNumber - receipt.blockNumber + 1 >= confirms) {
                                resolve(receipt);
                                //this.off("block", listener);
                                if (timer) {
                                    clearTimeout(timer);
                                    timer = null;
                                }
                                return;
                            }
                        }
                    }
                    catch (error) {
                        console.log("EEE", error);
                    }
                    this.once("block", listener);
                }));
                if (timeout != null) {
                    timer = setTimeout(() => {
                        if (timer == null) {
                            return;
                        }
                        timer = null;
                        this.off("block", listener);
                        reject((0, index_js_6.makeError)("timeout", "TIMEOUT", { reason: "timeout" }));
                    }, timeout);
                }
                listener(yield this.getBlockNumber());
            }));
        });
    }
    waitForBlock(blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, index_js_6.assert)(false, "not implemented yet", "NOT_IMPLEMENTED", {
                operation: "waitForBlock"
            });
        });
    }
    /**
     *  Clear a timer created using the [[_setTimeout]] method.
     */
    _clearTimeout(timerId) {
        const timer = __classPrivateFieldGet(this, _AbstractProvider_timers, "f").get(timerId);
        if (!timer) {
            return;
        }
        if (timer.timer) {
            clearTimeout(timer.timer);
        }
        __classPrivateFieldGet(this, _AbstractProvider_timers, "f").delete(timerId);
    }
    /**
     *  Create a timer that will execute %%func%% after at least %%timeout%%
     *  (in ms). If %%timeout%% is unspecified, then %%func%% will execute
     *  in the next event loop.
     *
     *  [Pausing](AbstractProvider-paused) the provider will pause any
     *  associated timers.
     */
    _setTimeout(_func, timeout) {
        var _a, _b;
        if (timeout == null) {
            timeout = 0;
        }
        const timerId = (__classPrivateFieldSet(this, _AbstractProvider_nextTimer, (_b = __classPrivateFieldGet(this, _AbstractProvider_nextTimer, "f"), _a = _b++, _b), "f"), _a);
        const func = () => {
            __classPrivateFieldGet(this, _AbstractProvider_timers, "f").delete(timerId);
            _func();
        };
        if (this.paused) {
            __classPrivateFieldGet(this, _AbstractProvider_timers, "f").set(timerId, { timer: null, func, time: timeout });
        }
        else {
            const timer = setTimeout(func, timeout);
            __classPrivateFieldGet(this, _AbstractProvider_timers, "f").set(timerId, { timer, func, time: getTime() });
        }
        return timerId;
    }
    /**
     *  Perform %%func%% on each subscriber.
     */
    _forEachSubscriber(func) {
        for (const sub of __classPrivateFieldGet(this, _AbstractProvider_subs, "f").values()) {
            func(sub.subscriber);
        }
    }
    /**
     *  Sub-classes may override this to customize subscription
     *  implementations.
     */
    _getSubscriber(sub) {
        switch (sub.type) {
            case "debug":
            case "error":
            case "network":
                return new UnmanagedSubscriber(sub.type);
            case "block": {
                const subscriber = new subscriber_polling_js_1.PollingBlockSubscriber(this);
                subscriber.pollingInterval = this.pollingInterval;
                return subscriber;
            }
            case "safe":
            case "finalized":
                return new subscriber_polling_js_1.PollingBlockTagSubscriber(this, sub.type);
            case "event":
                return new subscriber_polling_js_1.PollingEventSubscriber(this, sub.filter);
            case "transaction":
                return new subscriber_polling_js_1.PollingTransactionSubscriber(this, sub.hash);
            case "orphan":
                return new subscriber_polling_js_1.PollingOrphanSubscriber(this, sub.filter);
        }
        throw new Error(`unsupported event: ${sub.type}`);
    }
    /**
     *  If a [[Subscriber]] fails and needs to replace itself, this
     *  method may be used.
     *
     *  For example, this is used for providers when using the
     *  ``eth_getFilterChanges`` method, which can return null if state
     *  filters are not supported by the backend, allowing the Subscriber
     *  to swap in a [[PollingEventSubscriber]].
     */
    _recoverSubscriber(oldSub, newSub) {
        for (const sub of __classPrivateFieldGet(this, _AbstractProvider_subs, "f").values()) {
            if (sub.subscriber === oldSub) {
                if (sub.started) {
                    sub.subscriber.stop();
                }
                sub.subscriber = newSub;
                if (sub.started) {
                    newSub.start();
                }
                if (__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f") != null) {
                    newSub.pause(__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f"));
                }
                break;
            }
        }
    }
    on(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getSub).call(this, event);
            sub.listeners.push({ listener, once: false });
            if (!sub.started) {
                sub.subscriber.start();
                sub.started = true;
                if (__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f") != null) {
                    sub.subscriber.pause(__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f"));
                }
            }
            return this;
        });
    }
    once(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getSub).call(this, event);
            sub.listeners.push({ listener, once: true });
            if (!sub.started) {
                sub.subscriber.start();
                sub.started = true;
                if (__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f") != null) {
                    sub.subscriber.pause(__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f"));
                }
            }
            return this;
        });
    }
    emit(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_hasSub).call(this, event, args);
            // If there is not subscription or if a recent emit removed
            // the last of them (which also deleted the sub) do nothing
            if (!sub || sub.listeners.length === 0) {
                return false;
            }
            ;
            const count = sub.listeners.length;
            sub.listeners = sub.listeners.filter(({ listener, once }) => {
                const payload = new index_js_6.EventPayload(this, (once ? null : listener), event);
                try {
                    listener.call(this, ...args, payload);
                }
                catch (error) { }
                return !once;
            });
            if (sub.listeners.length === 0) {
                if (sub.started) {
                    sub.subscriber.stop();
                }
                __classPrivateFieldGet(this, _AbstractProvider_subs, "f").delete(sub.tag);
            }
            return (count > 0);
        });
    }
    listenerCount(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event) {
                const sub = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_hasSub).call(this, event);
                if (!sub) {
                    return 0;
                }
                return sub.listeners.length;
            }
            let total = 0;
            for (const { listeners } of __classPrivateFieldGet(this, _AbstractProvider_subs, "f").values()) {
                total += listeners.length;
            }
            return total;
        });
    }
    listeners(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event) {
                const sub = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_hasSub).call(this, event);
                if (!sub) {
                    return [];
                }
                return sub.listeners.map(({ listener }) => listener);
            }
            let result = [];
            for (const { listeners } of __classPrivateFieldGet(this, _AbstractProvider_subs, "f").values()) {
                result = result.concat(listeners.map(({ listener }) => listener));
            }
            return result;
        });
    }
    off(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_hasSub).call(this, event);
            if (!sub) {
                return this;
            }
            if (listener) {
                const index = sub.listeners.map(({ listener }) => listener).indexOf(listener);
                if (index >= 0) {
                    sub.listeners.splice(index, 1);
                }
            }
            if (!listener || sub.listeners.length === 0) {
                if (sub.started) {
                    sub.subscriber.stop();
                }
                __classPrivateFieldGet(this, _AbstractProvider_subs, "f").delete(sub.tag);
            }
            return this;
        });
    }
    removeAllListeners(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event) {
                const { tag, started, subscriber } = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_getSub).call(this, event);
                if (started) {
                    subscriber.stop();
                }
                __classPrivateFieldGet(this, _AbstractProvider_subs, "f").delete(tag);
            }
            else {
                for (const [tag, { started, subscriber }] of __classPrivateFieldGet(this, _AbstractProvider_subs, "f")) {
                    if (started) {
                        subscriber.stop();
                    }
                    __classPrivateFieldGet(this, _AbstractProvider_subs, "f").delete(tag);
                }
            }
            return this;
        });
    }
    // Alias for "on"
    addListener(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.on(event, listener);
        });
    }
    // Alias for "off"
    removeListener(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.off(event, listener);
        });
    }
    /**
     *  If this provider has been destroyed using the [[destroy]] method.
     *
     *  Once destroyed, all resources are reclaimed, internal event loops
     *  and timers are cleaned up and no further requests may be sent to
     *  the provider.
     */
    get destroyed() {
        return __classPrivateFieldGet(this, _AbstractProvider_destroyed, "f");
    }
    /**
     *  Sub-classes may use this to shutdown any sockets or release their
     *  resources and reject any pending requests.
     *
     *  Sub-classes **must** call ``super.destroy()``.
     */
    destroy() {
        // Stop all listeners
        this.removeAllListeners();
        // Shut down all tiemrs
        for (const timerId of __classPrivateFieldGet(this, _AbstractProvider_timers, "f").keys()) {
            this._clearTimeout(timerId);
        }
        __classPrivateFieldSet(this, _AbstractProvider_destroyed, true, "f");
    }
    /**
     *  Whether the provider is currently paused.
     *
     *  A paused provider will not emit any events, and generally should
     *  not make any requests to the network, but that is up to sub-classes
     *  to manage.
     *
     *  Setting ``paused = true`` is identical to calling ``.pause(false)``,
     *  which will buffer any events that occur while paused until the
     *  provider is unpaused.
     */
    get paused() { return (__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f") != null); }
    set paused(pause) {
        if (!!pause === this.paused) {
            return;
        }
        if (this.paused) {
            this.resume();
        }
        else {
            this.pause(false);
        }
    }
    /**
     *  Pause the provider. If %%dropWhilePaused%%, any events that occur
     *  while paused are dropped, otherwise all events will be emitted once
     *  the provider is unpaused.
     */
    pause(dropWhilePaused) {
        __classPrivateFieldSet(this, _AbstractProvider_lastBlockNumber, -1, "f");
        if (__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f") != null) {
            if (__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f") == !!dropWhilePaused) {
                return;
            }
            (0, index_js_6.assert)(false, "cannot change pause type; resume first", "UNSUPPORTED_OPERATION", {
                operation: "pause"
            });
        }
        this._forEachSubscriber((s) => s.pause(dropWhilePaused));
        __classPrivateFieldSet(this, _AbstractProvider_pausedState, !!dropWhilePaused, "f");
        for (const timer of __classPrivateFieldGet(this, _AbstractProvider_timers, "f").values()) {
            // Clear the timer
            if (timer.timer) {
                clearTimeout(timer.timer);
            }
            // Remaining time needed for when we become unpaused
            timer.time = getTime() - timer.time;
        }
    }
    /**
     *  Resume the provider.
     */
    resume() {
        if (__classPrivateFieldGet(this, _AbstractProvider_pausedState, "f") == null) {
            return;
        }
        this._forEachSubscriber((s) => s.resume());
        __classPrivateFieldSet(this, _AbstractProvider_pausedState, null, "f");
        for (const timer of __classPrivateFieldGet(this, _AbstractProvider_timers, "f").values()) {
            // Remaining time when we were paused
            let timeout = timer.time;
            if (timeout < 0) {
                timeout = 0;
            }
            // Start time (in cause paused, so we con compute remaininf time)
            timer.time = getTime();
            // Start the timer
            setTimeout(timer.func, timeout);
        }
    }
}
exports.AbstractProvider = AbstractProvider;
_AbstractProvider_subs = new WeakMap(), _AbstractProvider_plugins = new WeakMap(), _AbstractProvider_pausedState = new WeakMap(), _AbstractProvider_destroyed = new WeakMap(), _AbstractProvider_networkPromise = new WeakMap(), _AbstractProvider_anyNetwork = new WeakMap(), _AbstractProvider_performCache = new WeakMap(), _AbstractProvider_lastBlockNumber = new WeakMap(), _AbstractProvider_nextTimer = new WeakMap(), _AbstractProvider_timers = new WeakMap(), _AbstractProvider_disableCcipRead = new WeakMap(), _AbstractProvider_options = new WeakMap(), _AbstractProvider_instances = new WeakSet(), _AbstractProvider_perform = function _AbstractProvider_perform(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const timeout = __classPrivateFieldGet(this, _AbstractProvider_options, "f").cacheTimeout;
        // Caching disabled
        if (timeout < 0) {
            return yield this._perform(req);
        }
        // Create a tag
        const tag = getTag(req.method, req);
        let perform = __classPrivateFieldGet(this, _AbstractProvider_performCache, "f").get(tag);
        if (!perform) {
            perform = this._perform(req);
            __classPrivateFieldGet(this, _AbstractProvider_performCache, "f").set(tag, perform);
            setTimeout(() => {
                if (__classPrivateFieldGet(this, _AbstractProvider_performCache, "f").get(tag) === perform) {
                    __classPrivateFieldGet(this, _AbstractProvider_performCache, "f").delete(tag);
                }
            }, timeout);
        }
        return yield perform;
    });
}, _AbstractProvider_call = function _AbstractProvider_call(tx, blockTag, attempt) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, index_js_6.assert)(attempt < MAX_CCIP_REDIRECTS, "CCIP read exceeded maximum redirections", "OFFCHAIN_FAULT", {
            reason: "TOO_MANY_REDIRECTS",
            transaction: Object.assign({}, tx, { blockTag, enableCcipRead: true })
        });
        // This came in as a PerformActionTransaction, so to/from are safe; we can cast
        const transaction = (0, provider_js_1.copyRequest)(tx);
        try {
            return (0, index_js_6.hexlify)(yield this._perform({ method: "call", transaction, blockTag }));
        }
        catch (error) {
            // CCIP Read OffchainLookup
            if (!this.disableCcipRead && (0, index_js_6.isCallException)(error) && error.data && attempt >= 0 && blockTag === "latest" && transaction.to != null && (0, index_js_6.dataSlice)(error.data, 0, 4) === "0x556f1830") {
                const data = error.data;
                const txSender = yield (0, index_js_1.resolveAddress)(transaction.to, this);
                // Parse the CCIP Read Arguments
                let ccipArgs;
                try {
                    ccipArgs = parseOffchainLookup((0, index_js_6.dataSlice)(error.data, 4));
                }
                catch (error) {
                    (0, index_js_6.assert)(false, error.message, "OFFCHAIN_FAULT", {
                        reason: "BAD_DATA", transaction, info: { data }
                    });
                }
                // Check the sender of the OffchainLookup matches the transaction
                (0, index_js_6.assert)(ccipArgs.sender.toLowerCase() === txSender.toLowerCase(), "CCIP Read sender mismatch", "CALL_EXCEPTION", {
                    action: "call",
                    data,
                    reason: "OffchainLookup",
                    transaction: transaction,
                    invocation: null,
                    revert: {
                        signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
                        name: "OffchainLookup",
                        args: ccipArgs.errorArgs
                    }
                });
                const ccipResult = yield this.ccipReadFetch(transaction, ccipArgs.calldata, ccipArgs.urls);
                (0, index_js_6.assert)(ccipResult != null, "CCIP Read failed to fetch data", "OFFCHAIN_FAULT", {
                    reason: "FETCH_FAILED", transaction, info: { data: error.data, errorArgs: ccipArgs.errorArgs }
                });
                const tx = {
                    to: txSender,
                    data: (0, index_js_6.concat)([ccipArgs.selector, encodeBytes([ccipResult, ccipArgs.extraData])])
                };
                this.emit("debug", { action: "sendCcipReadCall", transaction: tx });
                try {
                    const result = yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_call).call(this, tx, blockTag, attempt + 1);
                    this.emit("debug", { action: "receiveCcipReadCallResult", transaction: Object.assign({}, tx), result });
                    return result;
                }
                catch (error) {
                    this.emit("debug", { action: "receiveCcipReadCallError", transaction: Object.assign({}, tx), error });
                    throw error;
                }
            }
            throw error;
        }
    });
}, _AbstractProvider_checkNetwork = function _AbstractProvider_checkNetwork(promise) {
    return __awaiter(this, void 0, void 0, function* () {
        const { value } = yield (0, index_js_6.resolveProperties)({
            network: this.getNetwork(),
            value: promise
        });
        return value;
    });
}, _AbstractProvider_getAccountValue = function _AbstractProvider_getAccountValue(request, _address, _blockTag) {
    return __awaiter(this, void 0, void 0, function* () {
        let address = this._getAddress(_address);
        let blockTag = this._getBlockTag(_blockTag);
        if (typeof (address) !== "string" || typeof (blockTag) !== "string") {
            [address, blockTag] = yield Promise.all([address, blockTag]);
        }
        return yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_checkNetwork).call(this, __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, Object.assign(request, { address, blockTag })));
    });
}, _AbstractProvider_getBlock = function _AbstractProvider_getBlock(block, includeTransactions) {
    return __awaiter(this, void 0, void 0, function* () {
        // @TODO: Add CustomBlockPlugin check
        if ((0, index_js_6.isHexString)(block, 32)) {
            return yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, {
                method: "getBlock", blockHash: block, includeTransactions
            });
        }
        let blockTag = this._getBlockTag(block);
        if (typeof (blockTag) !== "string") {
            blockTag = yield blockTag;
        }
        return yield __classPrivateFieldGet(this, _AbstractProvider_instances, "m", _AbstractProvider_perform).call(this, {
            method: "getBlock", blockTag, includeTransactions
        });
    });
}, _AbstractProvider_hasSub = function _AbstractProvider_hasSub(event, emitArgs) {
    return __awaiter(this, void 0, void 0, function* () {
        let sub = yield getSubscription(event, this);
        // This is a log that is removing an existing log; we actually want
        // to emit an orphan event for the removed log
        if (sub.type === "event" && emitArgs && emitArgs.length > 0 && emitArgs[0].removed === true) {
            sub = yield getSubscription({ orphan: "drop-log", log: emitArgs[0] }, this);
        }
        return __classPrivateFieldGet(this, _AbstractProvider_subs, "f").get(sub.tag) || null;
    });
}, _AbstractProvider_getSub = function _AbstractProvider_getSub(event) {
    return __awaiter(this, void 0, void 0, function* () {
        const subscription = yield getSubscription(event, this);
        // Prevent tampering with our tag in any subclass' _getSubscriber
        const tag = subscription.tag;
        let sub = __classPrivateFieldGet(this, _AbstractProvider_subs, "f").get(tag);
        if (!sub) {
            const subscriber = this._getSubscriber(subscription);
            const addressableMap = new WeakMap();
            const nameMap = new Map();
            sub = { subscriber, tag, addressableMap, nameMap, started: false, listeners: [] };
            __classPrivateFieldGet(this, _AbstractProvider_subs, "f").set(tag, sub);
        }
        return sub;
    });
};
function _parseString(result, start) {
    try {
        const bytes = _parseBytes(result, start);
        if (bytes) {
            return (0, index_js_6.toUtf8String)(bytes);
        }
    }
    catch (error) { }
    return null;
}
function _parseBytes(result, start) {
    if (result === "0x") {
        return null;
    }
    try {
        const offset = (0, index_js_6.getNumber)((0, index_js_6.dataSlice)(result, start, start + 32));
        const length = (0, index_js_6.getNumber)((0, index_js_6.dataSlice)(result, offset, offset + 32));
        return (0, index_js_6.dataSlice)(result, offset + 32, offset + 32 + length);
    }
    catch (error) { }
    return null;
}
function numPad(value) {
    const result = (0, index_js_6.toBeArray)(value);
    if (result.length > 32) {
        throw new Error("internal; should not happen");
    }
    const padded = new Uint8Array(32);
    padded.set(result, 32 - result.length);
    return padded;
}
function bytesPad(value) {
    if ((value.length % 32) === 0) {
        return value;
    }
    const result = new Uint8Array(Math.ceil(value.length / 32) * 32);
    result.set(value);
    return result;
}
const empty = new Uint8Array([]);
// ABI Encodes a series of (bytes, bytes, ...)
function encodeBytes(datas) {
    const result = [];
    let byteCount = 0;
    // Add place-holders for pointers as we add items
    for (let i = 0; i < datas.length; i++) {
        result.push(empty);
        byteCount += 32;
    }
    for (let i = 0; i < datas.length; i++) {
        const data = (0, index_js_6.getBytes)(datas[i]);
        // Update the bytes offset
        result[i] = numPad(byteCount);
        // The length and padded value of data
        result.push(numPad(data.length));
        result.push(bytesPad(data));
        byteCount += 32 + Math.ceil(data.length / 32) * 32;
    }
    return (0, index_js_6.concat)(result);
}
const zeros = "0x0000000000000000000000000000000000000000000000000000000000000000";
function parseOffchainLookup(data) {
    const result = {
        sender: "", urls: [], calldata: "", selector: "", extraData: "", errorArgs: []
    };
    (0, index_js_6.assert)((0, index_js_6.dataLength)(data) >= 5 * 32, "insufficient OffchainLookup data", "OFFCHAIN_FAULT", {
        reason: "insufficient OffchainLookup data"
    });
    const sender = (0, index_js_6.dataSlice)(data, 0, 32);
    (0, index_js_6.assert)((0, index_js_6.dataSlice)(sender, 0, 12) === (0, index_js_6.dataSlice)(zeros, 0, 12), "corrupt OffchainLookup sender", "OFFCHAIN_FAULT", {
        reason: "corrupt OffchainLookup sender"
    });
    result.sender = (0, index_js_6.dataSlice)(sender, 12);
    // Read the URLs from the response
    try {
        const urls = [];
        const urlsOffset = (0, index_js_6.getNumber)((0, index_js_6.dataSlice)(data, 32, 64));
        const urlsLength = (0, index_js_6.getNumber)((0, index_js_6.dataSlice)(data, urlsOffset, urlsOffset + 32));
        const urlsData = (0, index_js_6.dataSlice)(data, urlsOffset + 32);
        for (let u = 0; u < urlsLength; u++) {
            const url = _parseString(urlsData, u * 32);
            if (url == null) {
                throw new Error("abort");
            }
            urls.push(url);
        }
        result.urls = urls;
    }
    catch (error) {
        (0, index_js_6.assert)(false, "corrupt OffchainLookup urls", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup urls"
        });
    }
    // Get the CCIP calldata to forward
    try {
        const calldata = _parseBytes(data, 64);
        if (calldata == null) {
            throw new Error("abort");
        }
        result.calldata = calldata;
    }
    catch (error) {
        (0, index_js_6.assert)(false, "corrupt OffchainLookup calldata", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup calldata"
        });
    }
    // Get the callbackSelector (bytes4)
    (0, index_js_6.assert)((0, index_js_6.dataSlice)(data, 100, 128) === (0, index_js_6.dataSlice)(zeros, 0, 28), "corrupt OffchainLookup callbaackSelector", "OFFCHAIN_FAULT", {
        reason: "corrupt OffchainLookup callbaackSelector"
    });
    result.selector = (0, index_js_6.dataSlice)(data, 96, 100);
    // Get the extra data to send back to the contract as context
    try {
        const extraData = _parseBytes(data, 128);
        if (extraData == null) {
            throw new Error("abort");
        }
        result.extraData = extraData;
    }
    catch (error) {
        (0, index_js_6.assert)(false, "corrupt OffchainLookup extraData", "OFFCHAIN_FAULT", {
            reason: "corrupt OffchainLookup extraData"
        });
    }
    result.errorArgs = "sender,urls,calldata,selector,extraData".split(/,/).map((k) => result[k]);
    return result;
}
//# sourceMappingURL=abstract-provider.js.map
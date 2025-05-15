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
var _FallbackProvider_instances, _FallbackProvider_configs, _FallbackProvider_height, _FallbackProvider_initialSyncPromise, _FallbackProvider_getNextConfig, _FallbackProvider_addRunner, _FallbackProvider_initialSync, _FallbackProvider_checkQuorum, _FallbackProvider_waitForQuorum;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackProvider = void 0;
/**
 *  A **FallbackProvider** providers resiliance, security and performatnce
 *  in a way that is customizable and configurable.
 *
 *  @_section: api/providers/fallback-provider:Fallback Provider [about-fallback-provider]
 */
const index_js_1 = require("../utils/index.js");
const abstract_provider_js_1 = require("./abstract-provider.js");
const network_js_1 = require("./network.js");
const BN_1 = BigInt("1");
const BN_2 = BigInt("2");
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
}
function stall(duration) {
    return new Promise((resolve) => { setTimeout(resolve, duration); });
}
function getTime() { return (new Date()).getTime(); }
function stringify(value) {
    return JSON.stringify(value, (key, value) => {
        if (typeof (value) === "bigint") {
            return { type: "bigint", value: value.toString() };
        }
        return value;
    });
}
;
const defaultConfig = { stallTimeout: 400, priority: 1, weight: 1 };
const defaultState = {
    blockNumber: -2, requests: 0, lateResponses: 0, errorResponses: 0,
    outOfSync: -1, unsupportedEvents: 0, rollingDuration: 0, score: 0,
    _network: null, _updateNumber: null, _totalTime: 0,
    _lastFatalError: null, _lastFatalErrorTimestamp: 0
};
function waitForSync(config, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        while (config.blockNumber < 0 || config.blockNumber < blockNumber) {
            if (!config._updateNumber) {
                config._updateNumber = (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const blockNumber = yield config.provider.getBlockNumber();
                        if (blockNumber > config.blockNumber) {
                            config.blockNumber = blockNumber;
                        }
                    }
                    catch (error) {
                        config.blockNumber = -2;
                        config._lastFatalError = error;
                        config._lastFatalErrorTimestamp = getTime();
                    }
                    config._updateNumber = null;
                }))();
            }
            yield config._updateNumber;
            config.outOfSync++;
            if (config._lastFatalError) {
                break;
            }
        }
    });
}
function _normalize(value) {
    if (value == null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "[" + (value.map(_normalize)).join(",") + "]";
    }
    if (typeof (value) === "object" && typeof (value.toJSON) === "function") {
        return _normalize(value.toJSON());
    }
    switch (typeof (value)) {
        case "boolean":
        case "symbol":
            return value.toString();
        case "bigint":
        case "number":
            return BigInt(value).toString();
        case "string":
            return JSON.stringify(value);
        case "object": {
            const keys = Object.keys(value);
            keys.sort();
            return "{" + keys.map((k) => `${JSON.stringify(k)}:${_normalize(value[k])}`).join(",") + "}";
        }
    }
    console.log("Could not serialize", value);
    throw new Error("Hmm...");
}
function normalizeResult(value) {
    if ("error" in value) {
        const error = value.error;
        return { tag: _normalize(error), value: error };
    }
    const result = value.result;
    return { tag: _normalize(result), value: result };
}
// This strategy picks the highest weight result, as long as the weight is
// equal to or greater than quorum
function checkQuorum(quorum, results) {
    const tally = new Map();
    for (const { value, tag, weight } of results) {
        const t = tally.get(tag) || { value, weight: 0 };
        t.weight += weight;
        tally.set(tag, t);
    }
    let best = null;
    for (const r of tally.values()) {
        if (r.weight >= quorum && (!best || r.weight > best.weight)) {
            best = r;
        }
    }
    if (best) {
        return best.value;
    }
    return undefined;
}
function getMedian(quorum, results) {
    let resultWeight = 0;
    const errorMap = new Map();
    let bestError = null;
    const values = [];
    for (const { value, tag, weight } of results) {
        if (value instanceof Error) {
            const e = errorMap.get(tag) || { value, weight: 0 };
            e.weight += weight;
            errorMap.set(tag, e);
            if (bestError == null || e.weight > bestError.weight) {
                bestError = e;
            }
        }
        else {
            values.push(BigInt(value));
            resultWeight += weight;
        }
    }
    if (resultWeight < quorum) {
        // We have quorum for an error
        if (bestError && bestError.weight >= quorum) {
            return bestError.value;
        }
        // We do not have quorum for a result
        return undefined;
    }
    // Get the sorted values
    values.sort((a, b) => ((a < b) ? -1 : (b > a) ? 1 : 0));
    const mid = Math.floor(values.length / 2);
    // Odd-length; take the middle value
    if (values.length % 2) {
        return values[mid];
    }
    // Even length; take the ceiling of the mean of the center two values
    return (values[mid - 1] + values[mid] + BN_1) / BN_2;
}
function getAnyResult(quorum, results) {
    // If any value or error meets quorum, that is our preferred result
    const result = checkQuorum(quorum, results);
    if (result !== undefined) {
        return result;
    }
    // Otherwise, do we have any result?
    for (const r of results) {
        if (r.value) {
            return r.value;
        }
    }
    // Nope!
    return undefined;
}
function getFuzzyMode(quorum, results) {
    if (quorum === 1) {
        return (0, index_js_1.getNumber)(getMedian(quorum, results), "%internal");
    }
    const tally = new Map();
    const add = (result, weight) => {
        const t = tally.get(result) || { result, weight: 0 };
        t.weight += weight;
        tally.set(result, t);
    };
    for (const { weight, value } of results) {
        const r = (0, index_js_1.getNumber)(value);
        add(r - 1, weight);
        add(r, weight);
        add(r + 1, weight);
    }
    let bestWeight = 0;
    let bestResult = undefined;
    for (const { weight, result } of tally.values()) {
        // Use this result, if this result meets quorum and has either:
        // - a better weight
        // - or equal weight, but the result is larger
        if (weight >= quorum && (weight > bestWeight || (bestResult != null && weight === bestWeight && result > bestResult))) {
            bestWeight = weight;
            bestResult = result;
        }
    }
    return bestResult;
}
/**
 *  A **FallbackProvider** manages several [[Providers]] providing
 *  resiliance by switching between slow or misbehaving nodes, security
 *  by requiring multiple backends to aggree and performance by allowing
 *  faster backends to respond earlier.
 *
 */
class FallbackProvider extends abstract_provider_js_1.AbstractProvider {
    /**
     *  Creates a new **FallbackProvider** with %%providers%% connected to
     *  %%network%%.
     *
     *  If a [[Provider]] is included in %%providers%%, defaults are used
     *  for the configuration.
     */
    constructor(providers, network, options) {
        super(network, options);
        _FallbackProvider_instances.add(this);
        _FallbackProvider_configs.set(this, void 0);
        _FallbackProvider_height.set(this, void 0);
        _FallbackProvider_initialSyncPromise.set(this, void 0);
        __classPrivateFieldSet(this, _FallbackProvider_configs, providers.map((p) => {
            if (p instanceof abstract_provider_js_1.AbstractProvider) {
                return Object.assign({ provider: p }, defaultConfig, defaultState);
            }
            else {
                return Object.assign({}, defaultConfig, p, defaultState);
            }
        }), "f");
        __classPrivateFieldSet(this, _FallbackProvider_height, -2, "f");
        __classPrivateFieldSet(this, _FallbackProvider_initialSyncPromise, null, "f");
        if (options && options.quorum != null) {
            this.quorum = options.quorum;
        }
        else {
            this.quorum = Math.ceil(__classPrivateFieldGet(this, _FallbackProvider_configs, "f").reduce((accum, config) => {
                accum += config.weight;
                return accum;
            }, 0) / 2);
        }
        this.eventQuorum = 1;
        this.eventWorkers = 1;
        (0, index_js_1.assertArgument)(this.quorum <= __classPrivateFieldGet(this, _FallbackProvider_configs, "f").reduce((a, c) => (a + c.weight), 0), "quorum exceed provider wieght", "quorum", this.quorum);
    }
    get providerConfigs() {
        return __classPrivateFieldGet(this, _FallbackProvider_configs, "f").map((c) => {
            const result = Object.assign({}, c);
            for (const key in result) {
                if (key[0] === "_") {
                    delete result[key];
                }
            }
            return result;
        });
    }
    _detectNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            return network_js_1.Network.from((0, index_js_1.getBigInt)(yield this._perform({ method: "chainId" })));
        });
    }
    // @TODO: Add support to select providers to be the event subscriber
    //_getSubscriber(sub: Subscription): Subscriber {
    //    throw new Error("@TODO");
    //}
    /**
     *  Transforms a %%req%% into the correct method call on %%provider%%.
     */
    _translatePerform(provider, req) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (req.method) {
                case "broadcastTransaction":
                    return yield provider.broadcastTransaction(req.signedTransaction);
                case "call":
                    return yield provider.call(Object.assign({}, req.transaction, { blockTag: req.blockTag }));
                case "chainId":
                    return (yield provider.getNetwork()).chainId;
                case "estimateGas":
                    return yield provider.estimateGas(req.transaction);
                case "getBalance":
                    return yield provider.getBalance(req.address, req.blockTag);
                case "getBlock": {
                    const block = ("blockHash" in req) ? req.blockHash : req.blockTag;
                    return yield provider.getBlock(block, req.includeTransactions);
                }
                case "getBlockNumber":
                    return yield provider.getBlockNumber();
                case "getCode":
                    return yield provider.getCode(req.address, req.blockTag);
                case "getGasPrice":
                    return (yield provider.getFeeData()).gasPrice;
                case "getPriorityFee":
                    return (yield provider.getFeeData()).maxPriorityFeePerGas;
                case "getLogs":
                    return yield provider.getLogs(req.filter);
                case "getStorage":
                    return yield provider.getStorage(req.address, req.position, req.blockTag);
                case "getTransaction":
                    return yield provider.getTransaction(req.hash);
                case "getTransactionCount":
                    return yield provider.getTransactionCount(req.address, req.blockTag);
                case "getTransactionReceipt":
                    return yield provider.getTransactionReceipt(req.hash);
                case "getTransactionResult":
                    return yield provider.getTransactionResult(req.hash);
            }
        });
    }
    _perform(req) {
        return __awaiter(this, void 0, void 0, function* () {
            // Broadcasting a transaction is rare (ish) and already incurs
            // a cost on the user, so spamming is safe-ish. Just send it to
            // every backend.
            if (req.method === "broadcastTransaction") {
                // Once any broadcast provides a positive result, use it. No
                // need to wait for anyone else
                const results = __classPrivateFieldGet(this, _FallbackProvider_configs, "f").map((c) => null);
                const broadcasts = __classPrivateFieldGet(this, _FallbackProvider_configs, "f").map(({ provider, weight }, index) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const result = yield provider._perform(req);
                        results[index] = Object.assign(normalizeResult({ result }), { weight });
                    }
                    catch (error) {
                        results[index] = Object.assign(normalizeResult({ error }), { weight });
                    }
                }));
                // As each promise finishes...
                while (true) {
                    // Check for a valid broadcast result
                    const done = results.filter((r) => (r != null));
                    for (const { value } of done) {
                        if (!(value instanceof Error)) {
                            return value;
                        }
                    }
                    // Check for a legit broadcast error (one which we cannot
                    // recover from; some nodes may return the following red
                    // herring events:
                    // - alredy seend (UNKNOWN_ERROR)
                    // - NONCE_EXPIRED
                    // - REPLACEMENT_UNDERPRICED
                    const result = checkQuorum(this.quorum, results.filter((r) => (r != null)));
                    if ((0, index_js_1.isError)(result, "INSUFFICIENT_FUNDS")) {
                        throw result;
                    }
                    // Kick off the next provider (if any)
                    const waiting = broadcasts.filter((b, i) => (results[i] == null));
                    if (waiting.length === 0) {
                        break;
                    }
                    yield Promise.race(waiting);
                }
                // Use standard quorum results; any result was returned above,
                // so this will find any error that met quorum if any
                const result = getAnyResult(this.quorum, results);
                (0, index_js_1.assert)(result !== undefined, "problem multi-broadcasting", "SERVER_ERROR", {
                    request: "%sub-requests",
                    info: { request: req, results: results.map(stringify) }
                });
                if (result instanceof Error) {
                    throw result;
                }
                return result;
            }
            yield __classPrivateFieldGet(this, _FallbackProvider_instances, "m", _FallbackProvider_initialSync).call(this);
            // Bootstrap enough runners to meet quorum
            const running = new Set();
            let inflightQuorum = 0;
            while (true) {
                const runner = __classPrivateFieldGet(this, _FallbackProvider_instances, "m", _FallbackProvider_addRunner).call(this, running, req);
                if (runner == null) {
                    break;
                }
                inflightQuorum += runner.config.weight;
                if (inflightQuorum >= this.quorum) {
                    break;
                }
            }
            const result = yield __classPrivateFieldGet(this, _FallbackProvider_instances, "m", _FallbackProvider_waitForQuorum).call(this, running, req);
            // Track requests sent to a provider that are still
            // outstanding after quorum has been otherwise found
            for (const runner of running) {
                if (runner.perform && runner.result == null) {
                    runner.config.lateResponses++;
                }
            }
            return result;
        });
    }
    destroy() {
        const _super = Object.create(null, {
            destroy: { get: () => super.destroy }
        });
        return __awaiter(this, void 0, void 0, function* () {
            for (const { provider } of __classPrivateFieldGet(this, _FallbackProvider_configs, "f")) {
                provider.destroy();
            }
            _super.destroy.call(this);
        });
    }
}
exports.FallbackProvider = FallbackProvider;
_FallbackProvider_configs = new WeakMap(), _FallbackProvider_height = new WeakMap(), _FallbackProvider_initialSyncPromise = new WeakMap(), _FallbackProvider_instances = new WeakSet(), _FallbackProvider_getNextConfig = function _FallbackProvider_getNextConfig(running) {
    // @TODO: Maybe do a check here to favour (heavily) providers that
    //        do not require waitForSync and disfavour providers that
    //        seem down-ish or are behaving slowly
    const configs = Array.from(running).map((r) => r.config);
    // Shuffle the states, sorted by priority
    const allConfigs = __classPrivateFieldGet(this, _FallbackProvider_configs, "f").slice();
    shuffle(allConfigs);
    allConfigs.sort((a, b) => (a.priority - b.priority));
    for (const config of allConfigs) {
        if (config._lastFatalError) {
            continue;
        }
        if (configs.indexOf(config) === -1) {
            return config;
        }
    }
    return null;
}, _FallbackProvider_addRunner = function _FallbackProvider_addRunner(running, req) {
    const config = __classPrivateFieldGet(this, _FallbackProvider_instances, "m", _FallbackProvider_getNextConfig).call(this, running);
    // No runners available
    if (config == null) {
        return null;
    }
    // Create a new runner
    const runner = {
        config, result: null, didBump: false,
        perform: null, staller: null
    };
    const now = getTime();
    // Start performing this operation
    runner.perform = (() => __awaiter(this, void 0, void 0, function* () {
        try {
            config.requests++;
            const result = yield this._translatePerform(config.provider, req);
            runner.result = { result };
        }
        catch (error) {
            config.errorResponses++;
            runner.result = { error };
        }
        const dt = (getTime() - now);
        config._totalTime += dt;
        config.rollingDuration = 0.95 * config.rollingDuration + 0.05 * dt;
        runner.perform = null;
    }))();
    // Start a staller; when this times out, it's time to force
    // kicking off another runner because we are taking too long
    runner.staller = (() => __awaiter(this, void 0, void 0, function* () {
        yield stall(config.stallTimeout);
        runner.staller = null;
    }))();
    running.add(runner);
    return runner;
}, _FallbackProvider_initialSync = function _FallbackProvider_initialSync() {
    return __awaiter(this, void 0, void 0, function* () {
        let initialSync = __classPrivateFieldGet(this, _FallbackProvider_initialSyncPromise, "f");
        if (!initialSync) {
            const promises = [];
            __classPrivateFieldGet(this, _FallbackProvider_configs, "f").forEach((config) => {
                promises.push((() => __awaiter(this, void 0, void 0, function* () {
                    yield waitForSync(config, 0);
                    if (!config._lastFatalError) {
                        config._network = yield config.provider.getNetwork();
                    }
                }))());
            });
            __classPrivateFieldSet(this, _FallbackProvider_initialSyncPromise, initialSync = (() => __awaiter(this, void 0, void 0, function* () {
                // Wait for all providers to have a block number and network
                yield Promise.all(promises);
                // Check all the networks match
                let chainId = null;
                for (const config of __classPrivateFieldGet(this, _FallbackProvider_configs, "f")) {
                    if (config._lastFatalError) {
                        continue;
                    }
                    const network = (config._network);
                    if (chainId == null) {
                        chainId = network.chainId;
                    }
                    else if (network.chainId !== chainId) {
                        (0, index_js_1.assert)(false, "cannot mix providers on different networks", "UNSUPPORTED_OPERATION", {
                            operation: "new FallbackProvider"
                        });
                    }
                }
            }))(), "f");
        }
        yield initialSync;
    });
}, _FallbackProvider_checkQuorum = function _FallbackProvider_checkQuorum(running, req) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get all the result objects
        const results = [];
        for (const runner of running) {
            if (runner.result != null) {
                const { tag, value } = normalizeResult(runner.result);
                results.push({ tag, value, weight: runner.config.weight });
            }
        }
        // Are there enough results to event meet quorum?
        if (results.reduce((a, r) => (a + r.weight), 0) < this.quorum) {
            return undefined;
        }
        switch (req.method) {
            case "getBlockNumber": {
                // We need to get the bootstrap block height
                if (__classPrivateFieldGet(this, _FallbackProvider_height, "f") === -2) {
                    __classPrivateFieldSet(this, _FallbackProvider_height, Math.ceil((0, index_js_1.getNumber)(getMedian(this.quorum, __classPrivateFieldGet(this, _FallbackProvider_configs, "f").filter((c) => (!c._lastFatalError)).map((c) => ({
                        value: c.blockNumber,
                        tag: (0, index_js_1.getNumber)(c.blockNumber).toString(),
                        weight: c.weight
                    }))))), "f");
                }
                // Find the mode across all the providers, allowing for
                // a little drift between block heights
                const mode = getFuzzyMode(this.quorum, results);
                if (mode === undefined) {
                    return undefined;
                }
                if (mode > __classPrivateFieldGet(this, _FallbackProvider_height, "f")) {
                    __classPrivateFieldSet(this, _FallbackProvider_height, mode, "f");
                }
                return __classPrivateFieldGet(this, _FallbackProvider_height, "f");
            }
            case "getGasPrice":
            case "getPriorityFee":
            case "estimateGas":
                return getMedian(this.quorum, results);
            case "getBlock":
                // Pending blocks are in the mempool and already
                // quite untrustworthy; just grab anything
                if ("blockTag" in req && req.blockTag === "pending") {
                    return getAnyResult(this.quorum, results);
                }
                return checkQuorum(this.quorum, results);
            case "call":
            case "chainId":
            case "getBalance":
            case "getTransactionCount":
            case "getCode":
            case "getStorage":
            case "getTransaction":
            case "getTransactionReceipt":
            case "getLogs":
                return checkQuorum(this.quorum, results);
            case "broadcastTransaction":
                return getAnyResult(this.quorum, results);
        }
        (0, index_js_1.assert)(false, "unsupported method", "UNSUPPORTED_OPERATION", {
            operation: `_perform(${stringify(req.method)})`
        });
    });
}, _FallbackProvider_waitForQuorum = function _FallbackProvider_waitForQuorum(running, req) {
    return __awaiter(this, void 0, void 0, function* () {
        if (running.size === 0) {
            throw new Error("no runners?!");
        }
        // Any promises that are interesting to watch for; an expired stall
        // or a successful perform
        const interesting = [];
        let newRunners = 0;
        for (const runner of running) {
            // No responses, yet; keep an eye on it
            if (runner.perform) {
                interesting.push(runner.perform);
            }
            // Still stalling...
            if (runner.staller) {
                interesting.push(runner.staller);
                continue;
            }
            // This runner has already triggered another runner
            if (runner.didBump) {
                continue;
            }
            // Got a response (result or error) or stalled; kick off another runner
            runner.didBump = true;
            newRunners++;
        }
        // Check if we have reached quorum on a result (or error)
        const value = yield __classPrivateFieldGet(this, _FallbackProvider_instances, "m", _FallbackProvider_checkQuorum).call(this, running, req);
        if (value !== undefined) {
            if (value instanceof Error) {
                throw value;
            }
            return value;
        }
        // Add any new runners, because a staller timed out or a result
        // or error response came in.
        for (let i = 0; i < newRunners; i++) {
            __classPrivateFieldGet(this, _FallbackProvider_instances, "m", _FallbackProvider_addRunner).call(this, running, req);
        }
        // All providers have returned, and we have no result
        (0, index_js_1.assert)(interesting.length > 0, "quorum not met", "SERVER_ERROR", {
            request: "%sub-requests",
            info: { request: req, results: Array.from(running).map((r) => stringify(r.result)) }
        });
        // Wait for someone to either complete its perform or stall out
        yield Promise.race(interesting);
        // This is recursive, but at worst case the depth is 2x the
        // number of providers (each has a perform and a staller)
        return yield __classPrivateFieldGet(this, _FallbackProvider_instances, "m", _FallbackProvider_waitForQuorum).call(this, running, req);
    });
};
//# sourceMappingURL=provider-fallback.js.map
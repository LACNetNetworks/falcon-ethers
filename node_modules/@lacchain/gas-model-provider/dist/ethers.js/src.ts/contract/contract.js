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
var _PreparedTopicFilter_filter;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = exports.BaseContract = exports.resolveArgs = exports.copyOverrides = void 0;
const index_js_1 = require("../abi/index.js");
const index_js_2 = require("../address/index.js");
// import from provider.ts instead of index.ts to prevent circular dep
// from EtherscanProvider
const provider_js_1 = require("../providers/provider.js");
const index_js_3 = require("../utils/index.js");
const wrappers_js_1 = require("./wrappers.js");
const BN_0 = BigInt(0);
function canCall(value) {
    return (value && typeof (value.call) === "function");
}
function canEstimate(value) {
    return (value && typeof (value.estimateGas) === "function");
}
function canResolve(value) {
    return (value && typeof (value.resolveName) === "function");
}
function canSend(value) {
    return (value && typeof (value.sendTransaction) === "function");
}
function getResolver(value) {
    if (value != null) {
        if (canResolve(value)) {
            return value;
        }
        if (value.provider) {
            return value.provider;
        }
    }
    return undefined;
}
class PreparedTopicFilter {
    constructor(contract, fragment, args) {
        _PreparedTopicFilter_filter.set(this, void 0);
        (0, index_js_3.defineProperties)(this, { fragment });
        if (fragment.inputs.length < args.length) {
            throw new Error("too many arguments");
        }
        // Recursively descend into args and resolve any addresses
        const runner = getRunner(contract.runner, "resolveName");
        const resolver = canResolve(runner) ? runner : null;
        __classPrivateFieldSet(this, _PreparedTopicFilter_filter, (function () {
            return __awaiter(this, void 0, void 0, function* () {
                const resolvedArgs = yield Promise.all(fragment.inputs.map((param, index) => {
                    const arg = args[index];
                    if (arg == null) {
                        return null;
                    }
                    return param.walkAsync(args[index], (type, value) => {
                        if (type === "address") {
                            if (Array.isArray(value)) {
                                return Promise.all(value.map((v) => (0, index_js_2.resolveAddress)(v, resolver)));
                            }
                            return (0, index_js_2.resolveAddress)(value, resolver);
                        }
                        return value;
                    });
                }));
                return contract.interface.encodeFilterTopics(fragment, resolvedArgs);
            });
        })(), "f");
    }
    getTopicFilter() {
        return __classPrivateFieldGet(this, _PreparedTopicFilter_filter, "f");
    }
}
_PreparedTopicFilter_filter = new WeakMap();
// A = Arguments passed in as a tuple
// R = The result type of the call (i.e. if only one return type,
//     the qualified type, otherwise Result)
// D = The type the default call will return (i.e. R for view/pure,
//     TransactionResponse otherwise)
//export interface ContractMethod<A extends Array<any> = Array<any>, R = any, D extends R | ContractTransactionResponse = ContractTransactionResponse> {
function getRunner(value, feature) {
    if (value == null) {
        return null;
    }
    if (typeof (value[feature]) === "function") {
        return value;
    }
    if (value.provider && typeof (value.provider[feature]) === "function") {
        return value.provider;
    }
    return null;
}
function getProvider(value) {
    if (value == null) {
        return null;
    }
    return value.provider || null;
}
/**
 *  @_ignore:
 */
function copyOverrides(arg, allowed) {
    return __awaiter(this, void 0, void 0, function* () {
        // Make sure the overrides passed in are a valid overrides object
        const _overrides = index_js_1.Typed.dereference(arg, "overrides");
        (0, index_js_3.assertArgument)(typeof (_overrides) === "object", "invalid overrides parameter", "overrides", arg);
        // Create a shallow copy (we'll deep-ify anything needed during normalizing)
        const overrides = (0, provider_js_1.copyRequest)(_overrides);
        (0, index_js_3.assertArgument)(overrides.to == null || (allowed || []).indexOf("to") >= 0, "cannot override to", "overrides.to", overrides.to);
        (0, index_js_3.assertArgument)(overrides.data == null || (allowed || []).indexOf("data") >= 0, "cannot override data", "overrides.data", overrides.data);
        // Resolve any from
        if (overrides.from) {
            overrides.from = overrides.from;
        }
        return overrides;
    });
}
exports.copyOverrides = copyOverrides;
/**
 *  @_ignore:
 */
function resolveArgs(_runner, inputs, args) {
    return __awaiter(this, void 0, void 0, function* () {
        // Recursively descend into args and resolve any addresses
        const runner = getRunner(_runner, "resolveName");
        const resolver = canResolve(runner) ? runner : null;
        return yield Promise.all(inputs.map((param, index) => {
            return param.walkAsync(args[index], (type, value) => {
                value = index_js_1.Typed.dereference(value, type);
                if (type === "address") {
                    return (0, index_js_2.resolveAddress)(value, resolver);
                }
                return value;
            });
        }));
    });
}
exports.resolveArgs = resolveArgs;
function buildWrappedFallback(contract) {
    const populateTransaction = function (overrides) {
        return __awaiter(this, void 0, void 0, function* () {
            // If an overrides was passed in, copy it and normalize the values
            const tx = (yield copyOverrides(overrides, ["data"]));
            tx.to = yield contract.getAddress();
            if (tx.from) {
                tx.from = yield (0, index_js_2.resolveAddress)(tx.from, getResolver(contract.runner));
            }
            const iface = contract.interface;
            const noValue = ((0, index_js_3.getBigInt)((tx.value || BN_0), "overrides.value") === BN_0);
            const noData = ((tx.data || "0x") === "0x");
            if (iface.fallback && !iface.fallback.payable && iface.receive && !noData && !noValue) {
                (0, index_js_3.assertArgument)(false, "cannot send data to receive or send value to non-payable fallback", "overrides", overrides);
            }
            (0, index_js_3.assertArgument)(iface.fallback || noData, "cannot send data to receive-only contract", "overrides.data", tx.data);
            // Only allow payable contracts to set non-zero value
            const payable = iface.receive || (iface.fallback && iface.fallback.payable);
            (0, index_js_3.assertArgument)(payable || noValue, "cannot send value to non-payable fallback", "overrides.value", tx.value);
            // Only allow fallback contracts to set non-empty data
            (0, index_js_3.assertArgument)(iface.fallback || noData, "cannot send data to receive-only contract", "overrides.data", tx.data);
            return tx;
        });
    };
    const staticCall = function (overrides) {
        return __awaiter(this, void 0, void 0, function* () {
            const runner = getRunner(contract.runner, "call");
            (0, index_js_3.assert)(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", { operation: "call" });
            const tx = yield populateTransaction(overrides);
            try {
                return yield runner.call(tx);
            }
            catch (error) {
                if ((0, index_js_3.isCallException)(error) && error.data) {
                    throw contract.interface.makeError(error.data, tx);
                }
                throw error;
            }
        });
    };
    const send = function (overrides) {
        return __awaiter(this, void 0, void 0, function* () {
            const runner = contract.runner;
            (0, index_js_3.assert)(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", { operation: "sendTransaction" });
            const tx = yield runner.sendTransaction(yield populateTransaction(overrides));
            const provider = getProvider(contract.runner);
            // @TODO: the provider can be null; make a custom dummy provider that will throw a
            // meaningful error
            return new wrappers_js_1.ContractTransactionResponse(contract.interface, provider, tx);
        });
    };
    const estimateGas = function (overrides) {
        return __awaiter(this, void 0, void 0, function* () {
            const runner = getRunner(contract.runner, "estimateGas");
            (0, index_js_3.assert)(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", { operation: "estimateGas" });
            return yield runner.estimateGas(yield populateTransaction(overrides));
        });
    };
    const method = (overrides) => __awaiter(this, void 0, void 0, function* () {
        return yield send(overrides);
    });
    (0, index_js_3.defineProperties)(method, {
        _contract: contract,
        estimateGas,
        populateTransaction,
        send, staticCall
    });
    return method;
}
function buildWrappedMethod(contract, key) {
    const getFragment = function (...args) {
        const fragment = contract.interface.getFunction(key, args);
        (0, index_js_3.assert)(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
            operation: "fragment",
            info: { key, args }
        });
        return fragment;
    };
    const populateTransaction = function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const fragment = getFragment(...args);
            // If an overrides was passed in, copy it and normalize the values
            let overrides = {};
            if (fragment.inputs.length + 1 === args.length) {
                overrides = yield copyOverrides(args.pop());
                if (overrides.from) {
                    overrides.from = yield (0, index_js_2.resolveAddress)(overrides.from, getResolver(contract.runner));
                }
            }
            if (fragment.inputs.length !== args.length) {
                throw new Error("internal error: fragment inputs doesn't match arguments; should not happen");
            }
            const resolvedArgs = yield resolveArgs(contract.runner, fragment.inputs, args);
            return Object.assign({}, overrides, yield (0, index_js_3.resolveProperties)({
                to: contract.getAddress(),
                data: contract.interface.encodeFunctionData(fragment, resolvedArgs)
            }));
        });
    };
    const staticCall = function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield staticCallResult(...args);
            if (result.length === 1) {
                return result[0];
            }
            return result;
        });
    };
    const send = function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const runner = contract.runner;
            (0, index_js_3.assert)(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", { operation: "sendTransaction" });
            const tx = yield runner.sendTransaction(yield populateTransaction(...args));
            const provider = getProvider(contract.runner);
            // @TODO: the provider can be null; make a custom dummy provider that will throw a
            // meaningful error
            return new wrappers_js_1.ContractTransactionResponse(contract.interface, provider, tx);
        });
    };
    const estimateGas = function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const runner = getRunner(contract.runner, "estimateGas");
            (0, index_js_3.assert)(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", { operation: "estimateGas" });
            return yield runner.estimateGas(yield populateTransaction(...args));
        });
    };
    const staticCallResult = function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const runner = getRunner(contract.runner, "call");
            (0, index_js_3.assert)(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", { operation: "call" });
            const tx = yield populateTransaction(...args);
            let result = "0x";
            try {
                result = yield runner.call(tx);
            }
            catch (error) {
                if ((0, index_js_3.isCallException)(error) && error.data) {
                    throw contract.interface.makeError(error.data, tx);
                }
                throw error;
            }
            const fragment = getFragment(...args);
            return contract.interface.decodeFunctionResult(fragment, result);
        });
    };
    const method = (...args) => __awaiter(this, void 0, void 0, function* () {
        const fragment = getFragment(...args);
        if (fragment.constant) {
            return yield staticCall(...args);
        }
        return yield send(...args);
    });
    (0, index_js_3.defineProperties)(method, {
        name: contract.interface.getFunctionName(key),
        _contract: contract, _key: key,
        getFragment,
        estimateGas,
        populateTransaction,
        send, staticCall, staticCallResult,
    });
    // Only works on non-ambiguous keys (refined fragment is always non-ambiguous)
    Object.defineProperty(method, "fragment", {
        configurable: false,
        enumerable: true,
        get: () => {
            const fragment = contract.interface.getFunction(key);
            (0, index_js_3.assert)(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
                operation: "fragment",
                info: { key }
            });
            return fragment;
        }
    });
    return method;
}
function buildWrappedEvent(contract, key) {
    const getFragment = function (...args) {
        const fragment = contract.interface.getEvent(key, args);
        (0, index_js_3.assert)(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
            operation: "fragment",
            info: { key, args }
        });
        return fragment;
    };
    const method = function (...args) {
        return new PreparedTopicFilter(contract, getFragment(...args), args);
    };
    (0, index_js_3.defineProperties)(method, {
        name: contract.interface.getEventName(key),
        _contract: contract, _key: key,
        getFragment
    });
    // Only works on non-ambiguous keys (refined fragment is always non-ambiguous)
    Object.defineProperty(method, "fragment", {
        configurable: false,
        enumerable: true,
        get: () => {
            const fragment = contract.interface.getEvent(key);
            (0, index_js_3.assert)(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
                operation: "fragment",
                info: { key }
            });
            return fragment;
        }
    });
    return method;
}
// The combination of TypeScrype, Private Fields and Proxies makes
// the world go boom; so we hide variables with some trickery keeping
// a symbol attached to each BaseContract which its sub-class (even
// via a Proxy) can reach and use to look up its internal values.
const internal = Symbol.for("_ethersInternal_contract");
const internalValues = new WeakMap();
function setInternal(contract, values) {
    internalValues.set(contract[internal], values);
}
function getInternal(contract) {
    return internalValues.get(contract[internal]);
}
function isDeferred(value) {
    return (value && typeof (value) === "object" && ("getTopicFilter" in value) &&
        (typeof (value.getTopicFilter) === "function") && value.fragment);
}
function getSubInfo(contract, event) {
    return __awaiter(this, void 0, void 0, function* () {
        let topics;
        let fragment = null;
        // Convert named events to topicHash and get the fragment for
        // events which need deconstructing.
        if (Array.isArray(event)) {
            const topicHashify = function (name) {
                if ((0, index_js_3.isHexString)(name, 32)) {
                    return name;
                }
                const fragment = contract.interface.getEvent(name);
                (0, index_js_3.assertArgument)(fragment, "unknown fragment", "name", name);
                return fragment.topicHash;
            };
            // Array of Topics and Names; e.g. `[ "0x1234...89ab", "Transfer(address)" ]`
            topics = event.map((e) => {
                if (e == null) {
                    return null;
                }
                if (Array.isArray(e)) {
                    return e.map(topicHashify);
                }
                return topicHashify(e);
            });
        }
        else if (event === "*") {
            topics = [null];
        }
        else if (typeof (event) === "string") {
            if ((0, index_js_3.isHexString)(event, 32)) {
                // Topic Hash
                topics = [event];
            }
            else {
                // Name or Signature; e.g. `"Transfer", `"Transfer(address)"`
                fragment = contract.interface.getEvent(event);
                (0, index_js_3.assertArgument)(fragment, "unknown fragment", "event", event);
                topics = [fragment.topicHash];
            }
        }
        else if (isDeferred(event)) {
            // Deferred Topic Filter; e.g. `contract.filter.Transfer(from)`
            topics = yield event.getTopicFilter();
        }
        else if ("fragment" in event) {
            // ContractEvent; e.g. `contract.filter.Transfer`
            fragment = event.fragment;
            topics = [fragment.topicHash];
        }
        else {
            (0, index_js_3.assertArgument)(false, "unknown event name", "event", event);
        }
        // Normalize topics and sort TopicSets
        topics = topics.map((t) => {
            if (t == null) {
                return null;
            }
            if (Array.isArray(t)) {
                const items = Array.from(new Set(t.map((t) => t.toLowerCase())).values());
                if (items.length === 1) {
                    return items[0];
                }
                items.sort();
                return items;
            }
            return t.toLowerCase();
        });
        const tag = topics.map((t) => {
            if (t == null) {
                return "null";
            }
            if (Array.isArray(t)) {
                return t.join("|");
            }
            return t;
        }).join("&");
        return { fragment, tag, topics };
    });
}
function hasSub(contract, event) {
    return __awaiter(this, void 0, void 0, function* () {
        const { subs } = getInternal(contract);
        return subs.get((yield getSubInfo(contract, event)).tag) || null;
    });
}
function getSub(contract, operation, event) {
    return __awaiter(this, void 0, void 0, function* () {
        // Make sure our runner can actually subscribe to events
        const provider = getProvider(contract.runner);
        (0, index_js_3.assert)(provider, "contract runner does not support subscribing", "UNSUPPORTED_OPERATION", { operation });
        const { fragment, tag, topics } = yield getSubInfo(contract, event);
        const { addr, subs } = getInternal(contract);
        let sub = subs.get(tag);
        if (!sub) {
            const address = (addr ? addr : contract);
            const filter = { address, topics };
            const listener = (log) => {
                let foundFragment = fragment;
                if (foundFragment == null) {
                    try {
                        foundFragment = contract.interface.getEvent(log.topics[0]);
                    }
                    catch (error) { }
                }
                // If fragment is null, we do not deconstruct the args to emit
                if (foundFragment) {
                    const _foundFragment = foundFragment;
                    const args = fragment ? contract.interface.decodeEventLog(fragment, log.data, log.topics) : [];
                    emit(contract, event, args, (listener) => {
                        return new wrappers_js_1.ContractEventPayload(contract, listener, event, _foundFragment, log);
                    });
                }
                else {
                    emit(contract, event, [], (listener) => {
                        return new wrappers_js_1.ContractUnknownEventPayload(contract, listener, event, log);
                    });
                }
            };
            let starting = [];
            const start = () => {
                if (starting.length) {
                    return;
                }
                starting.push(provider.on(filter, listener));
            };
            const stop = () => __awaiter(this, void 0, void 0, function* () {
                if (starting.length == 0) {
                    return;
                }
                let started = starting;
                starting = [];
                yield Promise.all(started);
                provider.off(filter, listener);
            });
            sub = { tag, listeners: [], start, stop };
            subs.set(tag, sub);
        }
        return sub;
    });
}
// We use this to ensure one emit resolves before firing the next to
// ensure correct ordering (note this cannot throw and just adds the
// notice to the event queu using setTimeout).
let lastEmit = Promise.resolve();
function _emit(contract, event, args, payloadFunc) {
    return __awaiter(this, void 0, void 0, function* () {
        yield lastEmit;
        const sub = yield hasSub(contract, event);
        if (!sub) {
            return false;
        }
        const count = sub.listeners.length;
        sub.listeners = sub.listeners.filter(({ listener, once }) => {
            const passArgs = Array.from(args);
            if (payloadFunc) {
                passArgs.push(payloadFunc(once ? null : listener));
            }
            try {
                listener.call(contract, ...passArgs);
            }
            catch (error) { }
            return !once;
        });
        if (sub.listeners.length === 0) {
            sub.stop();
            getInternal(contract).subs.delete(sub.tag);
        }
        return (count > 0);
    });
}
function emit(contract, event, args, payloadFunc) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield lastEmit;
        }
        catch (error) { }
        const resultPromise = _emit(contract, event, args, payloadFunc);
        lastEmit = resultPromise;
        return yield resultPromise;
    });
}
const passProperties = ["then"];
class BaseContract {
    /**
     *  Creates a new contract connected to %%target%% with the %%abi%% and
     *  optionally connected to a %%runner%% to perform operations on behalf
     *  of.
     */
    constructor(target, abi, runner, _deployTx) {
        (0, index_js_3.assertArgument)(typeof (target) === "string" || (0, index_js_2.isAddressable)(target), "invalid value for Contract target", "target", target);
        if (runner == null) {
            runner = null;
        }
        const iface = index_js_1.Interface.from(abi);
        (0, index_js_3.defineProperties)(this, { target, runner, interface: iface });
        Object.defineProperty(this, internal, { value: {} });
        let addrPromise;
        let addr = null;
        let deployTx = null;
        if (_deployTx) {
            const provider = getProvider(runner);
            // @TODO: the provider can be null; make a custom dummy provider that will throw a
            // meaningful error
            deployTx = new wrappers_js_1.ContractTransactionResponse(this.interface, provider, _deployTx);
        }
        let subs = new Map();
        // Resolve the target as the address
        if (typeof (target) === "string") {
            if ((0, index_js_3.isHexString)(target)) {
                addr = target;
                addrPromise = Promise.resolve(target);
            }
            else {
                const resolver = getRunner(runner, "resolveName");
                if (!canResolve(resolver)) {
                    throw (0, index_js_3.makeError)("contract runner does not support name resolution", "UNSUPPORTED_OPERATION", {
                        operation: "resolveName"
                    });
                }
                addrPromise = resolver.resolveName(target).then((addr) => {
                    if (addr == null) {
                        throw (0, index_js_3.makeError)("an ENS name used for a contract target must be correctly configured", "UNCONFIGURED_NAME", {
                            value: target
                        });
                    }
                    getInternal(this).addr = addr;
                    return addr;
                });
            }
        }
        else {
            addrPromise = target.getAddress().then((addr) => {
                if (addr == null) {
                    throw new Error("TODO");
                }
                getInternal(this).addr = addr;
                return addr;
            });
        }
        // Set our private values
        setInternal(this, { addrPromise, addr, deployTx, subs });
        // Add the event filters
        const filters = new Proxy({}, {
            get: (target, prop, receiver) => {
                // Pass important checks (like `then` for Promise) through
                if (typeof (prop) === "symbol" || passProperties.indexOf(prop) >= 0) {
                    return Reflect.get(target, prop, receiver);
                }
                try {
                    return this.getEvent(prop);
                }
                catch (error) {
                    if (!(0, index_js_3.isError)(error, "INVALID_ARGUMENT") || error.argument !== "key") {
                        throw error;
                    }
                }
                return undefined;
            },
            has: (target, prop) => {
                // Pass important checks (like `then` for Promise) through
                if (passProperties.indexOf(prop) >= 0) {
                    return Reflect.has(target, prop);
                }
                return Reflect.has(target, prop) || this.interface.hasEvent(String(prop));
            }
        });
        (0, index_js_3.defineProperties)(this, { filters });
        (0, index_js_3.defineProperties)(this, {
            fallback: ((iface.receive || iface.fallback) ? (buildWrappedFallback(this)) : null)
        });
        // Return a Proxy that will respond to functions
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (typeof (prop) === "symbol" || prop in target || passProperties.indexOf(prop) >= 0) {
                    return Reflect.get(target, prop, receiver);
                }
                // Undefined properties should return undefined
                try {
                    return target.getFunction(prop);
                }
                catch (error) {
                    if (!(0, index_js_3.isError)(error, "INVALID_ARGUMENT") || error.argument !== "key") {
                        throw error;
                    }
                }
                return undefined;
            },
            has: (target, prop) => {
                if (typeof (prop) === "symbol" || prop in target || passProperties.indexOf(prop) >= 0) {
                    return Reflect.has(target, prop);
                }
                return target.interface.hasFunction(prop);
            }
        });
    }
    /**
     *  Return a new Contract instance with the same target and ABI, but
     *  a different %%runner%%.
     */
    connect(runner) {
        return new BaseContract(this.target, this.interface, runner);
    }
    /**
     *  Return a new Contract instance with the same ABI and runner, but
     *  a different %%target%%.
     */
    attach(target) {
        return new BaseContract(target, this.interface, this.runner);
    }
    /**
     *  Return the resolved address of this Contract.
     */
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () { return yield getInternal(this).addrPromise; });
    }
    /**
     *  Return the deployed bytecode or null if no bytecode is found.
     */
    getDeployedCode() {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = getProvider(this.runner);
            (0, index_js_3.assert)(provider, "runner does not support .provider", "UNSUPPORTED_OPERATION", { operation: "getDeployedCode" });
            const code = yield provider.getCode(yield this.getAddress());
            if (code === "0x") {
                return null;
            }
            return code;
        });
    }
    /**
     *  Resolve to this Contract once the bytecode has been deployed, or
     *  resolve immediately if already deployed.
     */
    waitForDeployment() {
        return __awaiter(this, void 0, void 0, function* () {
            // We have the deployement transaction; just use that (throws if deployement fails)
            const deployTx = this.deploymentTransaction();
            if (deployTx) {
                yield deployTx.wait();
                return this;
            }
            // Check for code
            const code = yield this.getDeployedCode();
            if (code != null) {
                return this;
            }
            // Make sure we can subscribe to a provider event
            const provider = getProvider(this.runner);
            (0, index_js_3.assert)(provider != null, "contract runner does not support .provider", "UNSUPPORTED_OPERATION", { operation: "waitForDeployment" });
            return new Promise((resolve, reject) => {
                const checkCode = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const code = yield this.getDeployedCode();
                        if (code != null) {
                            return resolve(this);
                        }
                        provider.once("block", checkCode);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                checkCode();
            });
        });
    }
    /**
     *  Return the transaction used to deploy this contract.
     *
     *  This is only available if this instance was returned from a
     *  [[ContractFactory]].
     */
    deploymentTransaction() {
        return getInternal(this).deployTx;
    }
    /**
     *  Return the function for a given name. This is useful when a contract
     *  method name conflicts with a JavaScript name such as ``prototype`` or
     *  when using a Contract programatically.
     */
    getFunction(key) {
        if (typeof (key) !== "string") {
            key = key.format();
        }
        const func = buildWrappedMethod(this, key);
        return func;
    }
    /**
     *  Return the event for a given name. This is useful when a contract
     *  event name conflicts with a JavaScript name such as ``prototype`` or
     *  when using a Contract programatically.
     */
    getEvent(key) {
        if (typeof (key) !== "string") {
            key = key.format();
        }
        return buildWrappedEvent(this, key);
    }
    /**
     *  @_ignore:
     */
    queryTransaction(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("@TODO");
        });
    }
    /*
    // @TODO: this is a non-backwards compatible change, but will be added
    //        in v7 and in a potential SmartContract class in an upcoming
    //        v6 release
    async getTransactionReceipt(hash: string): Promise<null | ContractTransactionReceipt> {
        const provider = getProvider(this.runner);
        assert(provider, "contract runner does not have a provider",
            "UNSUPPORTED_OPERATION", { operation: "queryTransaction" });

        const receipt = await provider.getTransactionReceipt(hash);
        if (receipt == null) { return null; }

        return new ContractTransactionReceipt(this.interface, provider, receipt);
    }
    */
    /**
     *  Provide historic access to event data for %%event%% in the range
     *  %%fromBlock%% (default: ``0``) to %%toBlock%% (default: ``"latest"``)
     *  inclusive.
     */
    queryFilter(event, fromBlock, toBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fromBlock == null) {
                fromBlock = 0;
            }
            if (toBlock == null) {
                toBlock = "latest";
            }
            const { addr, addrPromise } = getInternal(this);
            const address = (addr ? addr : (yield addrPromise));
            const { fragment, topics } = yield getSubInfo(this, event);
            const filter = { address, topics, fromBlock, toBlock };
            const provider = getProvider(this.runner);
            (0, index_js_3.assert)(provider, "contract runner does not have a provider", "UNSUPPORTED_OPERATION", { operation: "queryFilter" });
            return (yield provider.getLogs(filter)).map((log) => {
                let foundFragment = fragment;
                if (foundFragment == null) {
                    try {
                        foundFragment = this.interface.getEvent(log.topics[0]);
                    }
                    catch (error) { }
                }
                if (foundFragment) {
                    try {
                        return new wrappers_js_1.EventLog(log, this.interface, foundFragment);
                    }
                    catch (error) {
                        return new wrappers_js_1.UndecodedEventLog(log, error);
                    }
                }
                return new provider_js_1.Log(log, provider);
            });
        });
    }
    /**
     *  Add an event %%listener%% for the %%event%%.
     */
    on(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield getSub(this, "on", event);
            sub.listeners.push({ listener, once: false });
            sub.start();
            return this;
        });
    }
    /**
     *  Add an event %%listener%% for the %%event%%, but remove the listener
     *  after it is fired once.
     */
    once(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield getSub(this, "once", event);
            sub.listeners.push({ listener, once: true });
            sub.start();
            return this;
        });
    }
    /**
     *  Emit an %%event%% calling all listeners with %%args%%.
     *
     *  Resolves to ``true`` if any listeners were called.
     */
    emit(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield emit(this, event, args, null);
        });
    }
    /**
     *  Resolves to the number of listeners of %%event%% or the total number
     *  of listeners if unspecified.
     */
    listenerCount(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event) {
                const sub = yield hasSub(this, event);
                if (!sub) {
                    return 0;
                }
                return sub.listeners.length;
            }
            const { subs } = getInternal(this);
            let total = 0;
            for (const { listeners } of subs.values()) {
                total += listeners.length;
            }
            return total;
        });
    }
    /**
     *  Resolves to the listeners subscribed to %%event%% or all listeners
     *  if unspecified.
     */
    listeners(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event) {
                const sub = yield hasSub(this, event);
                if (!sub) {
                    return [];
                }
                return sub.listeners.map(({ listener }) => listener);
            }
            const { subs } = getInternal(this);
            let result = [];
            for (const { listeners } of subs.values()) {
                result = result.concat(listeners.map(({ listener }) => listener));
            }
            return result;
        });
    }
    /**
     *  Remove the %%listener%% from the listeners for %%event%% or remove
     *  all listeners if unspecified.
     */
    off(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            const sub = yield hasSub(this, event);
            if (!sub) {
                return this;
            }
            if (listener) {
                const index = sub.listeners.map(({ listener }) => listener).indexOf(listener);
                if (index >= 0) {
                    sub.listeners.splice(index, 1);
                }
            }
            if (listener == null || sub.listeners.length === 0) {
                sub.stop();
                getInternal(this).subs.delete(sub.tag);
            }
            return this;
        });
    }
    /**
     *  Remove all the listeners for %%event%% or remove all listeners if
     *  unspecified.
     */
    removeAllListeners(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event) {
                const sub = yield hasSub(this, event);
                if (!sub) {
                    return this;
                }
                sub.stop();
                getInternal(this).subs.delete(sub.tag);
            }
            else {
                const { subs } = getInternal(this);
                for (const { tag, stop } of subs.values()) {
                    stop();
                    subs.delete(tag);
                }
            }
            return this;
        });
    }
    /**
     *  Alias for [on].
     */
    addListener(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.on(event, listener);
        });
    }
    /**
     *  Alias for [off].
     */
    removeListener(event, listener) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.off(event, listener);
        });
    }
    /**
     *  Create a new Class for the %%abi%%.
     */
    static buildClass(abi) {
        class CustomContract extends BaseContract {
            constructor(address, runner = null) {
                super(address, abi, runner);
            }
        }
        return CustomContract;
    }
    ;
    /**
     *  Create a new BaseContract with a specified Interface.
     */
    static from(target, abi, runner) {
        if (runner == null) {
            runner = null;
        }
        const contract = new this(target, abi, runner);
        return contract;
    }
}
exports.BaseContract = BaseContract;
function _ContractBase() {
    return BaseContract;
}
/**
 *  A [[BaseContract]] with no type guards on its methods or events.
 */
class Contract extends _ContractBase() {
}
exports.Contract = Contract;
//# sourceMappingURL=contract.js.map
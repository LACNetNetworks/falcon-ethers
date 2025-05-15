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
var _ContractTransactionReceipt_iface, _ContractTransactionResponse_iface;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractEventPayload = exports.ContractUnknownEventPayload = exports.ContractTransactionResponse = exports.ContractTransactionReceipt = exports.UndecodedEventLog = exports.EventLog = void 0;
// import from provider.ts instead of index.ts to prevent circular dep
// from EtherscanProvider
const provider_js_1 = require("../providers/provider.js");
const index_js_1 = require("../utils/index.js");
/**
 *  An **EventLog** contains additional properties parsed from the [[Log]].
 */
class EventLog extends provider_js_1.Log {
    /**
     * @_ignore:
     */
    constructor(log, iface, fragment) {
        super(log, log.provider);
        const args = iface.decodeEventLog(fragment, log.data, log.topics);
        (0, index_js_1.defineProperties)(this, { args, fragment, interface: iface });
    }
    /**
     *  The name of the event.
     */
    get eventName() { return this.fragment.name; }
    /**
     *  The signature of the event.
     */
    get eventSignature() { return this.fragment.format(); }
}
exports.EventLog = EventLog;
/**
 *  An **EventLog** contains additional properties parsed from the [[Log]].
 */
class UndecodedEventLog extends provider_js_1.Log {
    /**
     * @_ignore:
     */
    constructor(log, error) {
        super(log, log.provider);
        (0, index_js_1.defineProperties)(this, { error });
    }
}
exports.UndecodedEventLog = UndecodedEventLog;
/**
 *  A **ContractTransactionReceipt** includes the parsed logs from a
 *  [[TransactionReceipt]].
 */
class ContractTransactionReceipt extends provider_js_1.TransactionReceipt {
    /**
     *  @_ignore:
     */
    constructor(iface, provider, tx) {
        super(tx, provider);
        _ContractTransactionReceipt_iface.set(this, void 0);
        __classPrivateFieldSet(this, _ContractTransactionReceipt_iface, iface, "f");
    }
    /**
     *  The parsed logs for any [[Log]] which has a matching event in the
     *  Contract ABI.
     */
    get logs() {
        return super.logs.map((log) => {
            const fragment = log.topics.length ? __classPrivateFieldGet(this, _ContractTransactionReceipt_iface, "f").getEvent(log.topics[0]) : null;
            if (fragment) {
                try {
                    return new EventLog(log, __classPrivateFieldGet(this, _ContractTransactionReceipt_iface, "f"), fragment);
                }
                catch (error) {
                    return new UndecodedEventLog(log, error);
                }
            }
            return log;
        });
    }
}
exports.ContractTransactionReceipt = ContractTransactionReceipt;
_ContractTransactionReceipt_iface = new WeakMap();
/**
 *  A **ContractTransactionResponse** will return a
 *  [[ContractTransactionReceipt]] when waited on.
 */
class ContractTransactionResponse extends provider_js_1.TransactionResponse {
    /**
     *  @_ignore:
     */
    constructor(iface, provider, tx) {
        super(tx, provider);
        _ContractTransactionResponse_iface.set(this, void 0);
        __classPrivateFieldSet(this, _ContractTransactionResponse_iface, iface, "f");
    }
    /**
     *  Resolves once this transaction has been mined and has
     *  %%confirms%% blocks including it (default: ``1``) with an
     *  optional %%timeout%%.
     *
     *  This can resolve to ``null`` only if %%confirms%% is ``0``
     *  and the transaction has not been mined, otherwise this will
     *  wait until enough confirmations have completed.
     */
    wait(confirms) {
        const _super = Object.create(null, {
            wait: { get: () => super.wait }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const receipt = yield _super.wait.call(this, confirms);
            if (receipt == null) {
                return null;
            }
            return new ContractTransactionReceipt(__classPrivateFieldGet(this, _ContractTransactionResponse_iface, "f"), this.provider, receipt);
        });
    }
}
exports.ContractTransactionResponse = ContractTransactionResponse;
_ContractTransactionResponse_iface = new WeakMap();
/**
 *  A **ContractUnknownEventPayload** is included as the last parameter to
 *  Contract Events when the event does not match any events in the ABI.
 */
class ContractUnknownEventPayload extends index_js_1.EventPayload {
    /**
     *  @_event:
     */
    constructor(contract, listener, filter, log) {
        super(contract, listener, filter);
        (0, index_js_1.defineProperties)(this, { log });
    }
    /**
     *  Resolves to the block the event occured in.
     */
    getBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.log.getBlock();
        });
    }
    /**
     *  Resolves to the transaction the event occured in.
     */
    getTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.log.getTransaction();
        });
    }
    /**
     *  Resolves to the transaction receipt the event occured in.
     */
    getTransactionReceipt() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.log.getTransactionReceipt();
        });
    }
}
exports.ContractUnknownEventPayload = ContractUnknownEventPayload;
/**
 *  A **ContractEventPayload** is included as the last parameter to
 *  Contract Events when the event is known.
 */
class ContractEventPayload extends ContractUnknownEventPayload {
    /**
     *  @_ignore:
     */
    constructor(contract, listener, filter, fragment, _log) {
        super(contract, listener, filter, new EventLog(_log, contract.interface, fragment));
        const args = contract.interface.decodeEventLog(fragment, this.log.data, this.log.topics);
        (0, index_js_1.defineProperties)(this, { args, fragment });
    }
    /**
     *  The event name.
     */
    get eventName() {
        return this.fragment.name;
    }
    /**
     *  The event signature.
     */
    get eventSignature() {
        return this.fragment.format();
    }
}
exports.ContractEventPayload = ContractEventPayload;
//# sourceMappingURL=wrappers.js.map
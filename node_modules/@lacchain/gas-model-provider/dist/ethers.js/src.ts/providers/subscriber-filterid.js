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
var _FilterIdSubscriber_instances, _FilterIdSubscriber_provider, _FilterIdSubscriber_filterIdPromise, _FilterIdSubscriber_poller, _FilterIdSubscriber_running, _FilterIdSubscriber_network, _FilterIdSubscriber_hault, _FilterIdSubscriber_poll, _FilterIdSubscriber_teardown, _FilterIdEventSubscriber_event;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterIdPendingSubscriber = exports.FilterIdEventSubscriber = exports.FilterIdSubscriber = void 0;
const index_js_1 = require("../utils/index.js");
const subscriber_polling_js_1 = require("./subscriber-polling.js");
function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 *  Some backends support subscribing to events using a Filter ID.
 *
 *  When subscribing with this technique, the node issues a unique
 *  //Filter ID//. At this point the node dedicates resources to
 *  the filter, so that periodic calls to follow up on the //Filter ID//
 *  will receive any events since the last call.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class FilterIdSubscriber {
    /**
     *  Creates a new **FilterIdSubscriber** which will used [[_subscribe]]
     *  and [[_emitResults]] to setup the subscription and provide the event
     *  to the %%provider%%.
     */
    constructor(provider) {
        _FilterIdSubscriber_instances.add(this);
        _FilterIdSubscriber_provider.set(this, void 0);
        _FilterIdSubscriber_filterIdPromise.set(this, void 0);
        _FilterIdSubscriber_poller.set(this, void 0);
        _FilterIdSubscriber_running.set(this, void 0);
        _FilterIdSubscriber_network.set(this, void 0);
        _FilterIdSubscriber_hault.set(this, void 0);
        __classPrivateFieldSet(this, _FilterIdSubscriber_provider, provider, "f");
        __classPrivateFieldSet(this, _FilterIdSubscriber_filterIdPromise, null, "f");
        __classPrivateFieldSet(this, _FilterIdSubscriber_poller, __classPrivateFieldGet(this, _FilterIdSubscriber_instances, "m", _FilterIdSubscriber_poll).bind(this), "f");
        __classPrivateFieldSet(this, _FilterIdSubscriber_running, false, "f");
        __classPrivateFieldSet(this, _FilterIdSubscriber_network, null, "f");
        __classPrivateFieldSet(this, _FilterIdSubscriber_hault, false, "f");
    }
    /**
     *  Sub-classes **must** override this to begin the subscription.
     */
    _subscribe(provider) {
        throw new Error("subclasses must override this");
    }
    /**
     *  Sub-classes **must** override this handle the events.
     */
    _emitResults(provider, result) {
        throw new Error("subclasses must override this");
    }
    /**
     *  Sub-classes **must** override this handle recovery on errors.
     */
    _recover(provider) {
        throw new Error("subclasses must override this");
    }
    start() {
        if (__classPrivateFieldGet(this, _FilterIdSubscriber_running, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _FilterIdSubscriber_running, true, "f");
        __classPrivateFieldGet(this, _FilterIdSubscriber_instances, "m", _FilterIdSubscriber_poll).call(this, -2);
    }
    stop() {
        if (!__classPrivateFieldGet(this, _FilterIdSubscriber_running, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _FilterIdSubscriber_running, false, "f");
        __classPrivateFieldSet(this, _FilterIdSubscriber_hault, true, "f");
        __classPrivateFieldGet(this, _FilterIdSubscriber_instances, "m", _FilterIdSubscriber_teardown).call(this);
        __classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f").off("block", __classPrivateFieldGet(this, _FilterIdSubscriber_poller, "f"));
    }
    pause(dropWhilePaused) {
        if (dropWhilePaused) {
            __classPrivateFieldGet(this, _FilterIdSubscriber_instances, "m", _FilterIdSubscriber_teardown).call(this);
        }
        __classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f").off("block", __classPrivateFieldGet(this, _FilterIdSubscriber_poller, "f"));
    }
    resume() { this.start(); }
}
exports.FilterIdSubscriber = FilterIdSubscriber;
_FilterIdSubscriber_provider = new WeakMap(), _FilterIdSubscriber_filterIdPromise = new WeakMap(), _FilterIdSubscriber_poller = new WeakMap(), _FilterIdSubscriber_running = new WeakMap(), _FilterIdSubscriber_network = new WeakMap(), _FilterIdSubscriber_hault = new WeakMap(), _FilterIdSubscriber_instances = new WeakSet(), _FilterIdSubscriber_poll = function _FilterIdSubscriber_poll(blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Subscribe if necessary
            if (__classPrivateFieldGet(this, _FilterIdSubscriber_filterIdPromise, "f") == null) {
                __classPrivateFieldSet(this, _FilterIdSubscriber_filterIdPromise, this._subscribe(__classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f")), "f");
            }
            // Get the Filter ID
            let filterId = null;
            try {
                filterId = yield __classPrivateFieldGet(this, _FilterIdSubscriber_filterIdPromise, "f");
            }
            catch (error) {
                if (!(0, index_js_1.isError)(error, "UNSUPPORTED_OPERATION") || error.operation !== "eth_newFilter") {
                    throw error;
                }
            }
            // The backend does not support Filter ID; downgrade to
            // polling
            if (filterId == null) {
                __classPrivateFieldSet(this, _FilterIdSubscriber_filterIdPromise, null, "f");
                __classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f")._recoverSubscriber(this, this._recover(__classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f")));
                return;
            }
            const network = yield __classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f").getNetwork();
            if (!__classPrivateFieldGet(this, _FilterIdSubscriber_network, "f")) {
                __classPrivateFieldSet(this, _FilterIdSubscriber_network, network, "f");
            }
            if (__classPrivateFieldGet(this, _FilterIdSubscriber_network, "f").chainId !== network.chainId) {
                throw new Error("chaid changed");
            }
            if (__classPrivateFieldGet(this, _FilterIdSubscriber_hault, "f")) {
                return;
            }
            const result = yield __classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f").send("eth_getFilterChanges", [filterId]);
            yield this._emitResults(__classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f"), result);
        }
        catch (error) {
            console.log("@TODO", error);
        }
        __classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f").once("block", __classPrivateFieldGet(this, _FilterIdSubscriber_poller, "f"));
    });
}, _FilterIdSubscriber_teardown = function _FilterIdSubscriber_teardown() {
    const filterIdPromise = __classPrivateFieldGet(this, _FilterIdSubscriber_filterIdPromise, "f");
    if (filterIdPromise) {
        __classPrivateFieldSet(this, _FilterIdSubscriber_filterIdPromise, null, "f");
        filterIdPromise.then((filterId) => {
            __classPrivateFieldGet(this, _FilterIdSubscriber_provider, "f").send("eth_uninstallFilter", [filterId]);
        });
    }
};
/**
 *  A **FilterIdSubscriber** for receiving contract events.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class FilterIdEventSubscriber extends FilterIdSubscriber {
    /**
     *  Creates a new **FilterIdEventSubscriber** attached to %%provider%%
     *  listening for %%filter%%.
     */
    constructor(provider, filter) {
        super(provider);
        _FilterIdEventSubscriber_event.set(this, void 0);
        __classPrivateFieldSet(this, _FilterIdEventSubscriber_event, copy(filter), "f");
    }
    _recover(provider) {
        return new subscriber_polling_js_1.PollingEventSubscriber(provider, __classPrivateFieldGet(this, _FilterIdEventSubscriber_event, "f"));
    }
    _subscribe(provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const filterId = yield provider.send("eth_newFilter", [__classPrivateFieldGet(this, _FilterIdEventSubscriber_event, "f")]);
            return filterId;
        });
    }
    _emitResults(provider, results) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const result of results) {
                provider.emit(__classPrivateFieldGet(this, _FilterIdEventSubscriber_event, "f"), provider._wrapLog(result, provider._network));
            }
        });
    }
}
exports.FilterIdEventSubscriber = FilterIdEventSubscriber;
_FilterIdEventSubscriber_event = new WeakMap();
/**
 *  A **FilterIdSubscriber** for receiving pending transactions events.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class FilterIdPendingSubscriber extends FilterIdSubscriber {
    _subscribe(provider) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield provider.send("eth_newPendingTransactionFilter", []);
        });
    }
    _emitResults(provider, results) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const result of results) {
                provider.emit("pending", result);
            }
        });
    }
}
exports.FilterIdPendingSubscriber = FilterIdPendingSubscriber;
//# sourceMappingURL=subscriber-filterid.js.map
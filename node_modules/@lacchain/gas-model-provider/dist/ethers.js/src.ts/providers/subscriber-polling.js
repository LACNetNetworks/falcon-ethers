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
var _PollingBlockSubscriber_instances, _PollingBlockSubscriber_provider, _PollingBlockSubscriber_poller, _PollingBlockSubscriber_interval, _PollingBlockSubscriber_blockNumber, _PollingBlockSubscriber_poll, _OnBlockSubscriber_provider, _OnBlockSubscriber_poll, _OnBlockSubscriber_running, _PollingBlockTagSubscriber_tag, _PollingBlockTagSubscriber_lastBlock, _PollingOrphanSubscriber_filter, _PollingTransactionSubscriber_hash, _PollingEventSubscriber_instances, _PollingEventSubscriber_provider, _PollingEventSubscriber_filter, _PollingEventSubscriber_poller, _PollingEventSubscriber_running, _PollingEventSubscriber_blockNumber, _PollingEventSubscriber_poll;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingEventSubscriber = exports.PollingTransactionSubscriber = exports.PollingOrphanSubscriber = exports.PollingBlockTagSubscriber = exports.OnBlockSubscriber = exports.PollingBlockSubscriber = exports.getPollingSubscriber = void 0;
const index_js_1 = require("../utils/index.js");
function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 *  Return the polling subscriber for common events.
 *
 *  @_docloc: api/providers/abstract-provider
 */
function getPollingSubscriber(provider, event) {
    if (event === "block") {
        return new PollingBlockSubscriber(provider);
    }
    if ((0, index_js_1.isHexString)(event, 32)) {
        return new PollingTransactionSubscriber(provider, event);
    }
    (0, index_js_1.assert)(false, "unsupported polling event", "UNSUPPORTED_OPERATION", {
        operation: "getPollingSubscriber", info: { event }
    });
}
exports.getPollingSubscriber = getPollingSubscriber;
// @TODO: refactor this
/**
 *  A **PollingBlockSubscriber** polls at a regular interval for a change
 *  in the block number.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class PollingBlockSubscriber {
    /**
     *  Create a new **PollingBlockSubscriber** attached to %%provider%%.
     */
    constructor(provider) {
        _PollingBlockSubscriber_instances.add(this);
        _PollingBlockSubscriber_provider.set(this, void 0);
        _PollingBlockSubscriber_poller.set(this, void 0);
        _PollingBlockSubscriber_interval.set(this, void 0);
        // The most recent block we have scanned for events. The value -2
        // indicates we still need to fetch an initial block number
        _PollingBlockSubscriber_blockNumber.set(this, void 0);
        __classPrivateFieldSet(this, _PollingBlockSubscriber_provider, provider, "f");
        __classPrivateFieldSet(this, _PollingBlockSubscriber_poller, null, "f");
        __classPrivateFieldSet(this, _PollingBlockSubscriber_interval, 4000, "f");
        __classPrivateFieldSet(this, _PollingBlockSubscriber_blockNumber, -2, "f");
    }
    /**
     *  The polling interval.
     */
    get pollingInterval() { return __classPrivateFieldGet(this, _PollingBlockSubscriber_interval, "f"); }
    set pollingInterval(value) { __classPrivateFieldSet(this, _PollingBlockSubscriber_interval, value, "f"); }
    start() {
        if (__classPrivateFieldGet(this, _PollingBlockSubscriber_poller, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _PollingBlockSubscriber_poller, __classPrivateFieldGet(this, _PollingBlockSubscriber_provider, "f")._setTimeout(__classPrivateFieldGet(this, _PollingBlockSubscriber_instances, "m", _PollingBlockSubscriber_poll).bind(this), __classPrivateFieldGet(this, _PollingBlockSubscriber_interval, "f")), "f");
        __classPrivateFieldGet(this, _PollingBlockSubscriber_instances, "m", _PollingBlockSubscriber_poll).call(this);
    }
    stop() {
        if (!__classPrivateFieldGet(this, _PollingBlockSubscriber_poller, "f")) {
            return;
        }
        __classPrivateFieldGet(this, _PollingBlockSubscriber_provider, "f")._clearTimeout(__classPrivateFieldGet(this, _PollingBlockSubscriber_poller, "f"));
        __classPrivateFieldSet(this, _PollingBlockSubscriber_poller, null, "f");
    }
    pause(dropWhilePaused) {
        this.stop();
        if (dropWhilePaused) {
            __classPrivateFieldSet(this, _PollingBlockSubscriber_blockNumber, -2, "f");
        }
    }
    resume() {
        this.start();
    }
}
exports.PollingBlockSubscriber = PollingBlockSubscriber;
_PollingBlockSubscriber_provider = new WeakMap(), _PollingBlockSubscriber_poller = new WeakMap(), _PollingBlockSubscriber_interval = new WeakMap(), _PollingBlockSubscriber_blockNumber = new WeakMap(), _PollingBlockSubscriber_instances = new WeakSet(), _PollingBlockSubscriber_poll = function _PollingBlockSubscriber_poll() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const blockNumber = yield __classPrivateFieldGet(this, _PollingBlockSubscriber_provider, "f").getBlockNumber();
            // Bootstrap poll to setup our initial block number
            if (__classPrivateFieldGet(this, _PollingBlockSubscriber_blockNumber, "f") === -2) {
                __classPrivateFieldSet(this, _PollingBlockSubscriber_blockNumber, blockNumber, "f");
                return;
            }
            // @TODO: Put a cap on the maximum number of events per loop?
            if (blockNumber !== __classPrivateFieldGet(this, _PollingBlockSubscriber_blockNumber, "f")) {
                for (let b = __classPrivateFieldGet(this, _PollingBlockSubscriber_blockNumber, "f") + 1; b <= blockNumber; b++) {
                    // We have been stopped
                    if (__classPrivateFieldGet(this, _PollingBlockSubscriber_poller, "f") == null) {
                        return;
                    }
                    yield __classPrivateFieldGet(this, _PollingBlockSubscriber_provider, "f").emit("block", b);
                }
                __classPrivateFieldSet(this, _PollingBlockSubscriber_blockNumber, blockNumber, "f");
            }
        }
        catch (error) {
            // @TODO: Minor bump, add an "error" event to let subscribers
            //        know things went awry.
            //console.log(error);
        }
        // We have been stopped
        if (__classPrivateFieldGet(this, _PollingBlockSubscriber_poller, "f") == null) {
            return;
        }
        __classPrivateFieldSet(this, _PollingBlockSubscriber_poller, __classPrivateFieldGet(this, _PollingBlockSubscriber_provider, "f")._setTimeout(__classPrivateFieldGet(this, _PollingBlockSubscriber_instances, "m", _PollingBlockSubscriber_poll).bind(this), __classPrivateFieldGet(this, _PollingBlockSubscriber_interval, "f")), "f");
    });
};
/**
 *  An **OnBlockSubscriber** can be sub-classed, with a [[_poll]]
 *  implmentation which will be called on every new block.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class OnBlockSubscriber {
    /**
     *  Create a new **OnBlockSubscriber** attached to %%provider%%.
     */
    constructor(provider) {
        _OnBlockSubscriber_provider.set(this, void 0);
        _OnBlockSubscriber_poll.set(this, void 0);
        _OnBlockSubscriber_running.set(this, void 0);
        __classPrivateFieldSet(this, _OnBlockSubscriber_provider, provider, "f");
        __classPrivateFieldSet(this, _OnBlockSubscriber_running, false, "f");
        __classPrivateFieldSet(this, _OnBlockSubscriber_poll, (blockNumber) => {
            this._poll(blockNumber, __classPrivateFieldGet(this, _OnBlockSubscriber_provider, "f"));
        }, "f");
    }
    /**
     *  Called on every new block.
     */
    _poll(blockNumber, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("sub-classes must override this");
        });
    }
    start() {
        if (__classPrivateFieldGet(this, _OnBlockSubscriber_running, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _OnBlockSubscriber_running, true, "f");
        __classPrivateFieldGet(this, _OnBlockSubscriber_poll, "f").call(this, -2);
        __classPrivateFieldGet(this, _OnBlockSubscriber_provider, "f").on("block", __classPrivateFieldGet(this, _OnBlockSubscriber_poll, "f"));
    }
    stop() {
        if (!__classPrivateFieldGet(this, _OnBlockSubscriber_running, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _OnBlockSubscriber_running, false, "f");
        __classPrivateFieldGet(this, _OnBlockSubscriber_provider, "f").off("block", __classPrivateFieldGet(this, _OnBlockSubscriber_poll, "f"));
    }
    pause(dropWhilePaused) { this.stop(); }
    resume() { this.start(); }
}
exports.OnBlockSubscriber = OnBlockSubscriber;
_OnBlockSubscriber_provider = new WeakMap(), _OnBlockSubscriber_poll = new WeakMap(), _OnBlockSubscriber_running = new WeakMap();
class PollingBlockTagSubscriber extends OnBlockSubscriber {
    constructor(provider, tag) {
        super(provider);
        _PollingBlockTagSubscriber_tag.set(this, void 0);
        _PollingBlockTagSubscriber_lastBlock.set(this, void 0);
        __classPrivateFieldSet(this, _PollingBlockTagSubscriber_tag, tag, "f");
        __classPrivateFieldSet(this, _PollingBlockTagSubscriber_lastBlock, -2, "f");
    }
    pause(dropWhilePaused) {
        if (dropWhilePaused) {
            __classPrivateFieldSet(this, _PollingBlockTagSubscriber_lastBlock, -2, "f");
        }
        super.pause(dropWhilePaused);
    }
    _poll(blockNumber, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const block = yield provider.getBlock(__classPrivateFieldGet(this, _PollingBlockTagSubscriber_tag, "f"));
            if (block == null) {
                return;
            }
            if (__classPrivateFieldGet(this, _PollingBlockTagSubscriber_lastBlock, "f") === -2) {
                __classPrivateFieldSet(this, _PollingBlockTagSubscriber_lastBlock, block.number, "f");
            }
            else if (block.number > __classPrivateFieldGet(this, _PollingBlockTagSubscriber_lastBlock, "f")) {
                provider.emit(__classPrivateFieldGet(this, _PollingBlockTagSubscriber_tag, "f"), block.number);
                __classPrivateFieldSet(this, _PollingBlockTagSubscriber_lastBlock, block.number, "f");
            }
        });
    }
}
exports.PollingBlockTagSubscriber = PollingBlockTagSubscriber;
_PollingBlockTagSubscriber_tag = new WeakMap(), _PollingBlockTagSubscriber_lastBlock = new WeakMap();
/**
 *  @_ignore:
 *
 *  @_docloc: api/providers/abstract-provider
 */
class PollingOrphanSubscriber extends OnBlockSubscriber {
    constructor(provider, filter) {
        super(provider);
        _PollingOrphanSubscriber_filter.set(this, void 0);
        __classPrivateFieldSet(this, _PollingOrphanSubscriber_filter, copy(filter), "f");
    }
    _poll(blockNumber, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("@TODO");
            console.log(__classPrivateFieldGet(this, _PollingOrphanSubscriber_filter, "f"));
        });
    }
}
exports.PollingOrphanSubscriber = PollingOrphanSubscriber;
_PollingOrphanSubscriber_filter = new WeakMap();
/**
 *  A **PollingTransactionSubscriber** will poll for a given transaction
 *  hash for its receipt.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class PollingTransactionSubscriber extends OnBlockSubscriber {
    /**
     *  Create a new **PollingTransactionSubscriber** attached to
     *  %%provider%%, listening for %%hash%%.
     */
    constructor(provider, hash) {
        super(provider);
        _PollingTransactionSubscriber_hash.set(this, void 0);
        __classPrivateFieldSet(this, _PollingTransactionSubscriber_hash, hash, "f");
    }
    _poll(blockNumber, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield provider.getTransactionReceipt(__classPrivateFieldGet(this, _PollingTransactionSubscriber_hash, "f"));
            if (tx) {
                provider.emit(__classPrivateFieldGet(this, _PollingTransactionSubscriber_hash, "f"), tx);
            }
        });
    }
}
exports.PollingTransactionSubscriber = PollingTransactionSubscriber;
_PollingTransactionSubscriber_hash = new WeakMap();
/**
 *  A **PollingEventSubscriber** will poll for a given filter for its logs.
 *
 *  @_docloc: api/providers/abstract-provider
 */
class PollingEventSubscriber {
    /**
     *  Create a new **PollingTransactionSubscriber** attached to
     *  %%provider%%, listening for %%filter%%.
     */
    constructor(provider, filter) {
        _PollingEventSubscriber_instances.add(this);
        _PollingEventSubscriber_provider.set(this, void 0);
        _PollingEventSubscriber_filter.set(this, void 0);
        _PollingEventSubscriber_poller.set(this, void 0);
        _PollingEventSubscriber_running.set(this, void 0);
        // The most recent block we have scanned for events. The value -2
        // indicates we still need to fetch an initial block number
        _PollingEventSubscriber_blockNumber.set(this, void 0);
        __classPrivateFieldSet(this, _PollingEventSubscriber_provider, provider, "f");
        __classPrivateFieldSet(this, _PollingEventSubscriber_filter, copy(filter), "f");
        __classPrivateFieldSet(this, _PollingEventSubscriber_poller, __classPrivateFieldGet(this, _PollingEventSubscriber_instances, "m", _PollingEventSubscriber_poll).bind(this), "f");
        __classPrivateFieldSet(this, _PollingEventSubscriber_running, false, "f");
        __classPrivateFieldSet(this, _PollingEventSubscriber_blockNumber, -2, "f");
    }
    start() {
        if (__classPrivateFieldGet(this, _PollingEventSubscriber_running, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _PollingEventSubscriber_running, true, "f");
        if (__classPrivateFieldGet(this, _PollingEventSubscriber_blockNumber, "f") === -2) {
            __classPrivateFieldGet(this, _PollingEventSubscriber_provider, "f").getBlockNumber().then((blockNumber) => {
                __classPrivateFieldSet(this, _PollingEventSubscriber_blockNumber, blockNumber, "f");
            });
        }
        __classPrivateFieldGet(this, _PollingEventSubscriber_provider, "f").on("block", __classPrivateFieldGet(this, _PollingEventSubscriber_poller, "f"));
    }
    stop() {
        if (!__classPrivateFieldGet(this, _PollingEventSubscriber_running, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _PollingEventSubscriber_running, false, "f");
        __classPrivateFieldGet(this, _PollingEventSubscriber_provider, "f").off("block", __classPrivateFieldGet(this, _PollingEventSubscriber_poller, "f"));
    }
    pause(dropWhilePaused) {
        this.stop();
        if (dropWhilePaused) {
            __classPrivateFieldSet(this, _PollingEventSubscriber_blockNumber, -2, "f");
        }
    }
    resume() {
        this.start();
    }
}
exports.PollingEventSubscriber = PollingEventSubscriber;
_PollingEventSubscriber_provider = new WeakMap(), _PollingEventSubscriber_filter = new WeakMap(), _PollingEventSubscriber_poller = new WeakMap(), _PollingEventSubscriber_running = new WeakMap(), _PollingEventSubscriber_blockNumber = new WeakMap(), _PollingEventSubscriber_instances = new WeakSet(), _PollingEventSubscriber_poll = function _PollingEventSubscriber_poll(blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        // The initial block hasn't been determined yet
        if (__classPrivateFieldGet(this, _PollingEventSubscriber_blockNumber, "f") === -2) {
            return;
        }
        const filter = copy(__classPrivateFieldGet(this, _PollingEventSubscriber_filter, "f"));
        filter.fromBlock = __classPrivateFieldGet(this, _PollingEventSubscriber_blockNumber, "f") + 1;
        filter.toBlock = blockNumber;
        const logs = yield __classPrivateFieldGet(this, _PollingEventSubscriber_provider, "f").getLogs(filter);
        // No logs could just mean the node has not indexed them yet,
        // so we keep a sliding window of 60 blocks to keep scanning
        if (logs.length === 0) {
            if (__classPrivateFieldGet(this, _PollingEventSubscriber_blockNumber, "f") < blockNumber - 60) {
                __classPrivateFieldSet(this, _PollingEventSubscriber_blockNumber, blockNumber - 60, "f");
            }
            return;
        }
        for (const log of logs) {
            __classPrivateFieldGet(this, _PollingEventSubscriber_provider, "f").emit(__classPrivateFieldGet(this, _PollingEventSubscriber_filter, "f"), log);
            // Only advance the block number when logs were found to
            // account for networks (like BNB and Polygon) which may
            // sacrifice event consistency for block event speed
            __classPrivateFieldSet(this, _PollingEventSubscriber_blockNumber, log.blockNumber, "f");
        }
    });
};
//# sourceMappingURL=subscriber-polling.js.map
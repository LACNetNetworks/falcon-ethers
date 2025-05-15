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
var _Block_transactions, _TransactionReceipt_logs, _TransactionResponse_startBlock;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionResponse = exports.TransactionReceipt = exports.Log = exports.Block = exports.copyRequest = exports.FeeData = void 0;
//import { resolveAddress } from "@ethersproject/address";
const index_js_1 = require("../utils/index.js");
const index_js_2 = require("../transaction/index.js");
const BN_0 = BigInt(0);
// -----------------------
function getValue(value) {
    if (value == null) {
        return null;
    }
    return value;
}
function toJson(value) {
    if (value == null) {
        return null;
    }
    return value.toString();
}
// @TODO? <T extends FeeData = { }> implements Required<T>
/**
 *  A **FeeData** wraps all the fee-related values associated with
 *  the network.
 */
class FeeData {
    /**
     *  Creates a new FeeData for %%gasPrice%%, %%maxFeePerGas%% and
     *  %%maxPriorityFeePerGas%%.
     */
    constructor(gasPrice, maxFeePerGas, maxPriorityFeePerGas) {
        (0, index_js_1.defineProperties)(this, {
            gasPrice: getValue(gasPrice),
            maxFeePerGas: getValue(maxFeePerGas),
            maxPriorityFeePerGas: getValue(maxPriorityFeePerGas)
        });
    }
    /**
     *  Returns a JSON-friendly value.
     */
    toJSON() {
        const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = this;
        return {
            _type: "FeeData",
            gasPrice: toJson(gasPrice),
            maxFeePerGas: toJson(maxFeePerGas),
            maxPriorityFeePerGas: toJson(maxPriorityFeePerGas),
        };
    }
}
exports.FeeData = FeeData;
;
/**
 *  Returns a copy of %%req%% with all properties coerced to their strict
 *  types.
 */
function copyRequest(req) {
    const result = {};
    // These could be addresses, ENS names or Addressables
    if (req.to) {
        result.to = req.to;
    }
    if (req.from) {
        result.from = req.from;
    }
    if (req.data) {
        result.data = (0, index_js_1.hexlify)(req.data);
    }
    const bigIntKeys = "chainId,gasLimit,gasPrice,maxFeePerGas,maxPriorityFeePerGas,value".split(/,/);
    for (const key of bigIntKeys) {
        if (!(key in req) || req[key] == null) {
            continue;
        }
        result[key] = (0, index_js_1.getBigInt)(req[key], `request.${key}`);
    }
    const numberKeys = "type,nonce".split(/,/);
    for (const key of numberKeys) {
        if (!(key in req) || req[key] == null) {
            continue;
        }
        result[key] = (0, index_js_1.getNumber)(req[key], `request.${key}`);
    }
    if (req.accessList) {
        result.accessList = (0, index_js_2.accessListify)(req.accessList);
    }
    if ("blockTag" in req) {
        result.blockTag = req.blockTag;
    }
    if ("enableCcipRead" in req) {
        result.enableCcipRead = !!req.enableCcipRead;
    }
    if ("customData" in req) {
        result.customData = req.customData;
    }
    return result;
}
exports.copyRequest = copyRequest;
/**
 *  A **Block** represents the data associated with a full block on
 *  Ethereum.
 */
class Block {
    /**
     *  Create a new **Block** object.
     *
     *  This should generally not be necessary as the unless implementing a
     *  low-level library.
     */
    constructor(block, provider) {
        _Block_transactions.set(this, void 0);
        __classPrivateFieldSet(this, _Block_transactions, block.transactions.map((tx) => {
            if (typeof (tx) !== "string") {
                return new TransactionResponse(tx, provider);
            }
            return tx;
        }), "f");
        (0, index_js_1.defineProperties)(this, {
            provider,
            hash: getValue(block.hash),
            number: block.number,
            timestamp: block.timestamp,
            parentHash: block.parentHash,
            nonce: block.nonce,
            difficulty: block.difficulty,
            gasLimit: block.gasLimit,
            gasUsed: block.gasUsed,
            miner: block.miner,
            extraData: block.extraData,
            baseFeePerGas: getValue(block.baseFeePerGas)
        });
    }
    /**
     *  Returns the list of transaction hashes, in the order
     *  they were executed within the block.
     */
    get transactions() {
        return __classPrivateFieldGet(this, _Block_transactions, "f").map((tx) => {
            if (typeof (tx) === "string") {
                return tx;
            }
            return tx.hash;
        });
    }
    /**
     *  Returns the complete transactions, in the order they
     *  were executed within the block.
     *
     *  This is only available for blocks which prefetched
     *  transactions, by passing ``true`` to %%prefetchTxs%%
     *  into [[Provider-getBlock]].
     */
    get prefetchedTransactions() {
        const txs = __classPrivateFieldGet(this, _Block_transactions, "f").slice();
        // Doesn't matter...
        if (txs.length === 0) {
            return [];
        }
        // Make sure we prefetched the transactions
        (0, index_js_1.assert)(typeof (txs[0]) === "object", "transactions were not prefetched with block request", "UNSUPPORTED_OPERATION", {
            operation: "transactionResponses()"
        });
        return txs;
    }
    /**
     *  Returns a JSON-friendly value.
     */
    toJSON() {
        const { baseFeePerGas, difficulty, extraData, gasLimit, gasUsed, hash, miner, nonce, number, parentHash, timestamp, transactions } = this;
        return {
            _type: "Block",
            baseFeePerGas: toJson(baseFeePerGas),
            difficulty: toJson(difficulty),
            extraData,
            gasLimit: toJson(gasLimit),
            gasUsed: toJson(gasUsed),
            hash, miner, nonce, number, parentHash, timestamp,
            transactions,
        };
    }
    [(_Block_transactions = new WeakMap(), Symbol.iterator)]() {
        let index = 0;
        const txs = this.transactions;
        return {
            next: () => {
                if (index < this.length) {
                    return {
                        value: txs[index++], done: false
                    };
                }
                return { value: undefined, done: true };
            }
        };
    }
    /**
     *  The number of transactions in this block.
     */
    get length() { return __classPrivateFieldGet(this, _Block_transactions, "f").length; }
    /**
     *  The [[link-js-date]] this block was included at.
     */
    get date() {
        if (this.timestamp == null) {
            return null;
        }
        return new Date(this.timestamp * 1000);
    }
    /**
     *  Get the transaction at %%indexe%% within this block.
     */
    getTransaction(indexOrHash) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find the internal value by its index or hash
            let tx = undefined;
            if (typeof (indexOrHash) === "number") {
                tx = __classPrivateFieldGet(this, _Block_transactions, "f")[indexOrHash];
            }
            else {
                const hash = indexOrHash.toLowerCase();
                for (const v of __classPrivateFieldGet(this, _Block_transactions, "f")) {
                    if (typeof (v) === "string") {
                        if (v !== hash) {
                            continue;
                        }
                        tx = v;
                        break;
                    }
                    else {
                        if (v.hash === hash) {
                            continue;
                        }
                        tx = v;
                        break;
                    }
                }
            }
            if (tx == null) {
                throw new Error("no such tx");
            }
            if (typeof (tx) === "string") {
                return (yield this.provider.getTransaction(tx));
            }
            else {
                return tx;
            }
        });
    }
    /**
     *  If a **Block** was fetched with a request to include the transactions
     *  this will allow synchronous access to those transactions.
     *
     *  If the transactions were not prefetched, this will throw.
     */
    getPrefetchedTransaction(indexOrHash) {
        const txs = this.prefetchedTransactions;
        if (typeof (indexOrHash) === "number") {
            return txs[indexOrHash];
        }
        indexOrHash = indexOrHash.toLowerCase();
        for (const tx of txs) {
            if (tx.hash === indexOrHash) {
                return tx;
            }
        }
        (0, index_js_1.assertArgument)(false, "no matching transaction", "indexOrHash", indexOrHash);
    }
    /**
     *  Returns true if this block been mined. This provides a type guard
     *  for all properties on a [[MinedBlock]].
     */
    isMined() { return !!this.hash; }
    /**
     *  Returns true if this block is an [[link-eip-2930]] block.
     */
    isLondon() {
        return !!this.baseFeePerGas;
    }
    /**
     *  @_ignore:
     */
    orphanedEvent() {
        if (!this.isMined()) {
            throw new Error("");
        }
        return createOrphanedBlockFilter(this);
    }
}
exports.Block = Block;
//////////////////////
// Log
/**
 *  A **Log** in Ethereum represents an event that has been included in a
 *  transaction using the ``LOG*`` opcodes, which are most commonly used by
 *  Solidity's emit for announcing events.
 */
class Log {
    /**
     *  @_ignore:
     */
    constructor(log, provider) {
        this.provider = provider;
        const topics = Object.freeze(log.topics.slice());
        (0, index_js_1.defineProperties)(this, {
            transactionHash: log.transactionHash,
            blockHash: log.blockHash,
            blockNumber: log.blockNumber,
            removed: log.removed,
            address: log.address,
            data: log.data,
            topics,
            index: log.index,
            transactionIndex: log.transactionIndex,
        });
    }
    /**
     *  Returns a JSON-compatible object.
     */
    toJSON() {
        const { address, blockHash, blockNumber, data, index, removed, topics, transactionHash, transactionIndex } = this;
        return {
            _type: "log",
            address, blockHash, blockNumber, data, index,
            removed, topics, transactionHash, transactionIndex
        };
    }
    /**
     *  Returns the block that this log occurred in.
     */
    getBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const block = yield this.provider.getBlock(this.blockHash);
            (0, index_js_1.assert)(!!block, "failed to find transaction", "UNKNOWN_ERROR", {});
            return block;
        });
    }
    /**
     *  Returns the transaction that this log occurred in.
     */
    getTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this.provider.getTransaction(this.transactionHash);
            (0, index_js_1.assert)(!!tx, "failed to find transaction", "UNKNOWN_ERROR", {});
            return tx;
        });
    }
    /**
     *  Returns the transaction receipt fot the transaction that this
     *  log occurred in.
     */
    getTransactionReceipt() {
        return __awaiter(this, void 0, void 0, function* () {
            const receipt = yield this.provider.getTransactionReceipt(this.transactionHash);
            (0, index_js_1.assert)(!!receipt, "failed to find transaction receipt", "UNKNOWN_ERROR", {});
            return receipt;
        });
    }
    /**
     *  @_ignore:
     */
    removedEvent() {
        return createRemovedLogFilter(this);
    }
}
exports.Log = Log;
//////////////////////
// Transaction Receipt
/*
export interface LegacyTransactionReceipt {
    byzantium: false;
    status: null;
    root: string;
}

export interface ByzantiumTransactionReceipt {
    byzantium: true;
    status: number;
    root: null;
}
*/
/**
 *  A **TransactionReceipt** includes additional information about a
 *  transaction that is only available after it has been mined.
 */
class TransactionReceipt {
    /**
     *  @_ignore:
     */
    constructor(tx, provider) {
        _TransactionReceipt_logs.set(this, void 0);
        __classPrivateFieldSet(this, _TransactionReceipt_logs, Object.freeze(tx.logs.map((log) => {
            return new Log(log, provider);
        })), "f");
        let gasPrice = BN_0;
        if (tx.effectiveGasPrice != null) {
            gasPrice = tx.effectiveGasPrice;
        }
        else if (tx.gasPrice != null) {
            gasPrice = tx.gasPrice;
        }
        (0, index_js_1.defineProperties)(this, {
            provider,
            to: tx.to,
            from: tx.from,
            contractAddress: tx.contractAddress,
            hash: tx.hash,
            index: tx.index,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber,
            logsBloom: tx.logsBloom,
            gasUsed: tx.gasUsed,
            cumulativeGasUsed: tx.cumulativeGasUsed,
            gasPrice,
            type: tx.type,
            //byzantium: tx.byzantium,
            status: tx.status,
            root: tx.root
        });
    }
    /**
     *  The logs for this transaction.
     */
    get logs() { return __classPrivateFieldGet(this, _TransactionReceipt_logs, "f"); }
    /**
     *  Returns a JSON-compatible representation.
     */
    toJSON() {
        const { to, from, contractAddress, hash, index, blockHash, blockNumber, logsBloom, logs, //byzantium, 
        status, root } = this;
        return {
            _type: "TransactionReceipt",
            blockHash, blockNumber,
            //byzantium, 
            contractAddress,
            cumulativeGasUsed: toJson(this.cumulativeGasUsed),
            from,
            gasPrice: toJson(this.gasPrice),
            gasUsed: toJson(this.gasUsed),
            hash, index, logs, logsBloom, root, status, to
        };
    }
    /**
     *  @_ignore:
     */
    get length() { return this.logs.length; }
    [(_TransactionReceipt_logs = new WeakMap(), Symbol.iterator)]() {
        let index = 0;
        return {
            next: () => {
                if (index < this.length) {
                    return { value: this.logs[index++], done: false };
                }
                return { value: undefined, done: true };
            }
        };
    }
    /**
     *  The total fee for this transaction, in wei.
     */
    get fee() {
        return this.gasUsed * this.gasPrice;
    }
    /**
     *  Resolves to the block this transaction occurred in.
     */
    getBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const block = yield this.provider.getBlock(this.blockHash);
            if (block == null) {
                throw new Error("TODO");
            }
            return block;
        });
    }
    /**
     *  Resolves to the transaction this transaction occurred in.
     */
    getTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this.provider.getTransaction(this.hash);
            if (tx == null) {
                throw new Error("TODO");
            }
            return tx;
        });
    }
    /**
     *  Resolves to the return value of the execution of this transaction.
     *
     *  Support for this feature is limited, as it requires an archive node
     *  with the ``debug_`` or ``trace_`` API enabled.
     */
    getResult() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.provider.getTransactionResult(this.hash));
        });
    }
    /**
     *  Resolves to the number of confirmations this transaction has.
     */
    confirmations() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.provider.getBlockNumber()) - this.blockNumber + 1;
        });
    }
    /**
     *  @_ignore:
     */
    removedEvent() {
        return createRemovedTransactionFilter(this);
    }
    /**
     *  @_ignore:
     */
    reorderedEvent(other) {
        (0, index_js_1.assert)(!other || other.isMined(), "unmined 'other' transction cannot be orphaned", "UNSUPPORTED_OPERATION", { operation: "reorderedEvent(other)" });
        return createReorderedTransactionFilter(this, other);
    }
}
exports.TransactionReceipt = TransactionReceipt;
/**
 *  A **TransactionResponse** includes all properties about a transaction
 *  that was sent to the network, which may or may not be included in a
 *  block.
 *
 *  The [[TransactionResponse-isMined]] can be used to check if the
 *  transaction has been mined as well as type guard that the otherwise
 *  possibly ``null`` properties are defined.
 */
class TransactionResponse {
    /**
     *  @_ignore:
     */
    constructor(tx, provider) {
        _TransactionResponse_startBlock.set(this, void 0);
        this.provider = provider;
        this.blockNumber = (tx.blockNumber != null) ? tx.blockNumber : null;
        this.blockHash = (tx.blockHash != null) ? tx.blockHash : null;
        this.hash = tx.hash;
        this.index = tx.index;
        this.type = tx.type;
        this.from = tx.from;
        this.to = tx.to || null;
        this.gasLimit = tx.gasLimit;
        this.nonce = tx.nonce;
        this.data = tx.data;
        this.value = tx.value;
        this.gasPrice = tx.gasPrice;
        this.maxPriorityFeePerGas = (tx.maxPriorityFeePerGas != null) ? tx.maxPriorityFeePerGas : null;
        this.maxFeePerGas = (tx.maxFeePerGas != null) ? tx.maxFeePerGas : null;
        this.chainId = tx.chainId;
        this.signature = tx.signature;
        this.accessList = (tx.accessList != null) ? tx.accessList : null;
        __classPrivateFieldSet(this, _TransactionResponse_startBlock, -1, "f");
    }
    /**
     *  Returns a JSON-compatible representation of this transaction.
     */
    toJSON() {
        const { blockNumber, blockHash, index, hash, type, to, from, nonce, data, signature, accessList } = this;
        return {
            _type: "TransactionReceipt",
            accessList, blockNumber, blockHash,
            chainId: toJson(this.chainId),
            data, from,
            gasLimit: toJson(this.gasLimit),
            gasPrice: toJson(this.gasPrice),
            hash,
            maxFeePerGas: toJson(this.maxFeePerGas),
            maxPriorityFeePerGas: toJson(this.maxPriorityFeePerGas),
            nonce, signature, to, index, type,
            value: toJson(this.value),
        };
    }
    /**
     *  Resolves to the Block that this transaction was included in.
     *
     *  This will return null if the transaction has not been included yet.
     */
    getBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            let blockNumber = this.blockNumber;
            if (blockNumber == null) {
                const tx = yield this.getTransaction();
                if (tx) {
                    blockNumber = tx.blockNumber;
                }
            }
            if (blockNumber == null) {
                return null;
            }
            const block = this.provider.getBlock(blockNumber);
            if (block == null) {
                throw new Error("TODO");
            }
            return block;
        });
    }
    /**
     *  Resolves to this transaction being re-requested from the
     *  provider. This can be used if you have an unmined transaction
     *  and wish to get an up-to-date populated instance.
     */
    getTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.provider.getTransaction(this.hash);
        });
    }
    /**
     *  Resolve to the number of confirmations this transaction has.
     */
    confirmations() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.blockNumber == null) {
                const { tx, blockNumber } = yield (0, index_js_1.resolveProperties)({
                    tx: this.getTransaction(),
                    blockNumber: this.provider.getBlockNumber()
                });
                // Not mined yet...
                if (tx == null || tx.blockNumber == null) {
                    return 0;
                }
                return blockNumber - tx.blockNumber + 1;
            }
            const blockNumber = yield this.provider.getBlockNumber();
            return blockNumber - this.blockNumber + 1;
        });
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
    wait(_confirms, _timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const confirms = (_confirms == null) ? 1 : _confirms;
            const timeout = (_timeout == null) ? 0 : _timeout;
            let startBlock = __classPrivateFieldGet(this, _TransactionResponse_startBlock, "f");
            let nextScan = -1;
            let stopScanning = (startBlock === -1) ? true : false;
            const checkReplacement = () => __awaiter(this, void 0, void 0, function* () {
                // Get the current transaction count for this sender
                if (stopScanning) {
                    return null;
                }
                const { blockNumber, nonce } = yield (0, index_js_1.resolveProperties)({
                    blockNumber: this.provider.getBlockNumber(),
                    nonce: this.provider.getTransactionCount(this.from)
                });
                // No transaction or our nonce has not been mined yet; but we
                // can start scanning later when we do start
                if (nonce < this.nonce) {
                    startBlock = blockNumber;
                    return;
                }
                // We were mined; no replacement
                if (stopScanning) {
                    return null;
                }
                const mined = yield this.getTransaction();
                if (mined && mined.blockNumber != null) {
                    return;
                }
                // We were replaced; start scanning for that transaction
                // Starting to scan; look back a few extra blocks for safety
                if (nextScan === -1) {
                    nextScan = startBlock - 3;
                    if (nextScan < __classPrivateFieldGet(this, _TransactionResponse_startBlock, "f")) {
                        nextScan = __classPrivateFieldGet(this, _TransactionResponse_startBlock, "f");
                    }
                }
                while (nextScan <= blockNumber) {
                    // Get the next block to scan
                    if (stopScanning) {
                        return null;
                    }
                    const block = yield this.provider.getBlock(nextScan, true);
                    // This should not happen; but we'll try again shortly
                    if (block == null) {
                        return;
                    }
                    // We were mined; no replacement
                    for (const hash of block) {
                        if (hash === this.hash) {
                            return;
                        }
                    }
                    // Search for the transaction that replaced us
                    for (let i = 0; i < block.length; i++) {
                        const tx = yield block.getTransaction(i);
                        if (tx.from === this.from && tx.nonce === this.nonce) {
                            // Get the receipt
                            if (stopScanning) {
                                return null;
                            }
                            const receipt = yield this.provider.getTransactionReceipt(tx.hash);
                            // This should not happen; but we'll try again shortly
                            if (receipt == null) {
                                return;
                            }
                            // We will retry this on the next block (this case could be optimized)
                            if ((blockNumber - receipt.blockNumber + 1) < confirms) {
                                return;
                            }
                            // The reason we were replaced
                            let reason = "replaced";
                            if (tx.data === this.data && tx.to === this.to && tx.value === this.value) {
                                reason = "repriced";
                            }
                            else if (tx.data === "0x" && tx.from === tx.to && tx.value === BN_0) {
                                reason = "cancelled";
                            }
                            (0, index_js_1.assert)(false, "transaction was replaced", "TRANSACTION_REPLACED", {
                                cancelled: (reason === "replaced" || reason === "cancelled"),
                                reason,
                                replacement: tx.replaceableTransaction(startBlock),
                                hash: tx.hash,
                                receipt
                            });
                        }
                    }
                    nextScan++;
                }
                return;
            });
            const checkReceipt = (receipt) => {
                if (receipt == null || receipt.status !== 0) {
                    return receipt;
                }
                (0, index_js_1.assert)(false, "transaction execution reverted", "CALL_EXCEPTION", {
                    action: "sendTransaction",
                    data: null, reason: null, invocation: null, revert: null,
                    transaction: {
                        to: receipt.to,
                        from: receipt.from,
                        data: "" // @TODO: in v7, split out sendTransaction properties
                    }, receipt
                });
            };
            const receipt = yield this.provider.getTransactionReceipt(this.hash);
            if (confirms === 0) {
                return checkReceipt(receipt);
            }
            if (receipt) {
                if ((yield receipt.confirmations()) >= confirms) {
                    return checkReceipt(receipt);
                }
            }
            else {
                // Check for a replacement; throws if a replacement was found
                yield checkReplacement();
                // Allow null only when the confirms is 0
                if (confirms === 0) {
                    return null;
                }
            }
            const waiter = new Promise((resolve, reject) => {
                // List of things to cancel when we have a result (one way or the other)
                const cancellers = [];
                const cancel = () => { cancellers.forEach((c) => c()); };
                // On cancel, stop scanning for replacements
                cancellers.push(() => { stopScanning = true; });
                // Set up any timeout requested
                if (timeout > 0) {
                    const timer = setTimeout(() => {
                        cancel();
                        reject((0, index_js_1.makeError)("wait for transaction timeout", "TIMEOUT"));
                    }, timeout);
                    cancellers.push(() => { clearTimeout(timer); });
                }
                const txListener = (receipt) => __awaiter(this, void 0, void 0, function* () {
                    // Done; return it!
                    if ((yield receipt.confirmations()) >= confirms) {
                        cancel();
                        try {
                            resolve(checkReceipt(receipt));
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                });
                cancellers.push(() => { this.provider.off(this.hash, txListener); });
                this.provider.on(this.hash, txListener);
                // We support replacement detection; start checking
                if (startBlock >= 0) {
                    const replaceListener = () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            // Check for a replacement; this throws only if one is found
                            yield checkReplacement();
                        }
                        catch (error) {
                            // We were replaced (with enough confirms); re-throw the error
                            if ((0, index_js_1.isError)(error, "TRANSACTION_REPLACED")) {
                                cancel();
                                reject(error);
                                return;
                            }
                        }
                        // Rescheudle a check on the next block
                        if (!stopScanning) {
                            this.provider.once("block", replaceListener);
                        }
                    });
                    cancellers.push(() => { this.provider.off("block", replaceListener); });
                    this.provider.once("block", replaceListener);
                }
            });
            return yield waiter;
        });
    }
    /**
     *  Returns ``true`` if this transaction has been included.
     *
     *  This is effective only as of the time the TransactionResponse
     *  was instantiated. To get up-to-date information, use
     *  [[getTransaction]].
     *
     *  This provides a Type Guard that this transaction will have
     *  non-null property values for properties that are null for
     *  unmined transactions.
     */
    isMined() {
        return (this.blockHash != null);
    }
    /**
     *  Returns true if the transaction is a legacy (i.e. ``type == 0``)
     *  transaction.
     *
     *  This provides a Type Guard that this transaction will have
     *  the ``null``-ness for hardfork-specific properties set correctly.
     */
    isLegacy() {
        return (this.type === 0);
    }
    /**
     *  Returns true if the transaction is a Berlin (i.e. ``type == 1``)
     *  transaction. See [[link-eip-2070]].
     *
     *  This provides a Type Guard that this transaction will have
     *  the ``null``-ness for hardfork-specific properties set correctly.
     */
    isBerlin() {
        return (this.type === 1);
    }
    /**
     *  Returns true if the transaction is a London (i.e. ``type == 2``)
     *  transaction. See [[link-eip-1559]].
     *
     *  This provides a Type Guard that this transaction will have
     *  the ``null``-ness for hardfork-specific properties set correctly.
     */
    isLondon() {
        return (this.type === 2);
    }
    /**
     *  Returns a filter which can be used to listen for orphan events
     *  that evict this transaction.
     */
    removedEvent() {
        (0, index_js_1.assert)(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
        return createRemovedTransactionFilter(this);
    }
    /**
     *  Returns a filter which can be used to listen for orphan events
     *  that re-order this event against %%other%%.
     */
    reorderedEvent(other) {
        (0, index_js_1.assert)(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
        (0, index_js_1.assert)(!other || other.isMined(), "unmined 'other' transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
        return createReorderedTransactionFilter(this, other);
    }
    /**
     *  Returns a new TransactionResponse instance which has the ability to
     *  detect (and throw an error) if the transaction is replaced, which
     *  will begin scanning at %%startBlock%%.
     *
     *  This should generally not be used by developers and is intended
     *  primarily for internal use. Setting an incorrect %%startBlock%% can
     *  have devastating performance consequences if used incorrectly.
     */
    replaceableTransaction(startBlock) {
        (0, index_js_1.assertArgument)(Number.isInteger(startBlock) && startBlock >= 0, "invalid startBlock", "startBlock", startBlock);
        const tx = new TransactionResponse(this, this.provider);
        __classPrivateFieldSet(tx, _TransactionResponse_startBlock, startBlock, "f");
        return tx;
    }
}
exports.TransactionResponse = TransactionResponse;
_TransactionResponse_startBlock = new WeakMap();
function createOrphanedBlockFilter(block) {
    return { orphan: "drop-block", hash: block.hash, number: block.number };
}
function createReorderedTransactionFilter(tx, other) {
    return { orphan: "reorder-transaction", tx, other };
}
function createRemovedTransactionFilter(tx) {
    return { orphan: "drop-transaction", tx };
}
function createRemovedLogFilter(log) {
    return { orphan: "drop-log", log: {
            transactionHash: log.transactionHash,
            blockHash: log.blockHash,
            blockNumber: log.blockNumber,
            address: log.address,
            data: log.data,
            topics: Object.freeze(log.topics.slice()),
            index: log.index
        } };
}
//# sourceMappingURL=provider.js.map
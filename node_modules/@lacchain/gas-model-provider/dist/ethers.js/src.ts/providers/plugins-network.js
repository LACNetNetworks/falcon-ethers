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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _FeeDataNetworkPlugin_feeDataFunc, _FetchUrlFeeDataNetworkPlugin_url, _FetchUrlFeeDataNetworkPlugin_processFunc;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchUrlFeeDataNetworkPlugin = exports.FeeDataNetworkPlugin = exports.EnsPlugin = exports.GasCostPlugin = exports.NetworkPlugin = void 0;
const properties_js_1 = require("../utils/properties.js");
const index_js_1 = require("../utils/index.js");
const EnsAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
/**
 *  A **NetworkPlugin** provides additional functionality on a [[Network]].
 */
class NetworkPlugin {
    /**
     *  Creates a new **NetworkPlugin**.
     */
    constructor(name) {
        (0, properties_js_1.defineProperties)(this, { name });
    }
    /**
     *  Creates a copy of this plugin.
     */
    clone() {
        return new NetworkPlugin(this.name);
    }
}
exports.NetworkPlugin = NetworkPlugin;
/**
 *  A **GasCostPlugin** allows a network to provide alternative values when
 *  computing the intrinsic gas required for a transaction.
 */
class GasCostPlugin extends NetworkPlugin {
    /**
     *  Creates a new GasCostPlugin from %%effectiveBlock%% until the
     *  latest block or another GasCostPlugin supercedes that block number,
     *  with the associated %%costs%%.
     */
    constructor(effectiveBlock, costs) {
        if (effectiveBlock == null) {
            effectiveBlock = 0;
        }
        super(`org.ethers.network.plugins.GasCost#${(effectiveBlock || 0)}`);
        const props = { effectiveBlock };
        function set(name, nullish) {
            let value = (costs || {})[name];
            if (value == null) {
                value = nullish;
            }
            (0, index_js_1.assertArgument)(typeof (value) === "number", `invalud value for ${name}`, "costs", costs);
            props[name] = value;
        }
        set("txBase", 21000);
        set("txCreate", 32000);
        set("txDataZero", 4);
        set("txDataNonzero", 16);
        set("txAccessListStorageKey", 1900);
        set("txAccessListAddress", 2400);
        (0, properties_js_1.defineProperties)(this, props);
    }
    clone() {
        return new GasCostPlugin(this.effectiveBlock, this);
    }
}
exports.GasCostPlugin = GasCostPlugin;
/**
 *  An **EnsPlugin** allows a [[Network]] to specify the ENS Registry
 *  Contract address and the target network to use when using that
 *  contract.
 *
 *  Various testnets have their own instance of the contract to use, but
 *  in general, the mainnet instance supports multi-chain addresses and
 *  should be used.
 */
class EnsPlugin extends NetworkPlugin {
    /**
     *  Creates a new **EnsPlugin** connected to %%address%% on the
     *  %%targetNetwork%%. The default ENS address and mainnet is used
     *  if unspecified.
     */
    constructor(address, targetNetwork) {
        super("org.ethers.plugins.network.Ens");
        (0, properties_js_1.defineProperties)(this, {
            address: (address || EnsAddress),
            targetNetwork: ((targetNetwork == null) ? 1 : targetNetwork)
        });
    }
    clone() {
        return new EnsPlugin(this.address, this.targetNetwork);
    }
}
exports.EnsPlugin = EnsPlugin;
/**
 *  A **FeeDataNetworkPlugin** allows a network to provide and alternate
 *  means to specify its fee data.
 *
 *  For example, a network which does not support [[link-eip-1559]] may
 *  choose to use a Gas Station site to approximate the gas price.
 */
class FeeDataNetworkPlugin extends NetworkPlugin {
    /**
     *  The fee data function provided to the constructor.
     */
    get feeDataFunc() {
        return __classPrivateFieldGet(this, _FeeDataNetworkPlugin_feeDataFunc, "f");
    }
    /**
     *  Creates a new **FeeDataNetworkPlugin**.
     */
    constructor(feeDataFunc) {
        super("org.ethers.plugins.network.FeeData");
        _FeeDataNetworkPlugin_feeDataFunc.set(this, void 0);
        __classPrivateFieldSet(this, _FeeDataNetworkPlugin_feeDataFunc, feeDataFunc, "f");
    }
    /**
     *  Resolves to the fee data.
     */
    getFeeData(provider) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield __classPrivateFieldGet(this, _FeeDataNetworkPlugin_feeDataFunc, "f").call(this, provider);
        });
    }
    clone() {
        return new FeeDataNetworkPlugin(__classPrivateFieldGet(this, _FeeDataNetworkPlugin_feeDataFunc, "f"));
    }
}
exports.FeeDataNetworkPlugin = FeeDataNetworkPlugin;
_FeeDataNetworkPlugin_feeDataFunc = new WeakMap();
class FetchUrlFeeDataNetworkPlugin extends NetworkPlugin {
    /**
     *  The URL to initialize the FetchRequest with in %%processFunc%%.
     */
    get url() { return __classPrivateFieldGet(this, _FetchUrlFeeDataNetworkPlugin_url, "f"); }
    /**
     *  The callback to use when computing the FeeData.
     */
    get processFunc() { return __classPrivateFieldGet(this, _FetchUrlFeeDataNetworkPlugin_processFunc, "f"); }
    /**
     *  Creates a new **FetchUrlFeeDataNetworkPlugin** which will
     *  be used when computing the fee data for the network.
     */
    constructor(url, processFunc) {
        super("org.ethers.plugins.network.FetchUrlFeeDataPlugin");
        _FetchUrlFeeDataNetworkPlugin_url.set(this, void 0);
        _FetchUrlFeeDataNetworkPlugin_processFunc.set(this, void 0);
        __classPrivateFieldSet(this, _FetchUrlFeeDataNetworkPlugin_url, url, "f");
        __classPrivateFieldSet(this, _FetchUrlFeeDataNetworkPlugin_processFunc, processFunc, "f");
    }
    // We are immutable, so we can serve as our own clone
    clone() { return this; }
}
exports.FetchUrlFeeDataNetworkPlugin = FetchUrlFeeDataNetworkPlugin;
_FetchUrlFeeDataNetworkPlugin_url = new WeakMap(), _FetchUrlFeeDataNetworkPlugin_processFunc = new WeakMap();
/*
export class CustomBlockNetworkPlugin extends NetworkPlugin {
    readonly #blockFunc: (provider: Provider, block: BlockParams<string>) => Block<string>;
    readonly #blockWithTxsFunc: (provider: Provider, block: BlockParams<TransactionResponseParams>) => Block<TransactionResponse>;

    constructor(blockFunc: (provider: Provider, block: BlockParams<string>) => Block<string>, blockWithTxsFunc: (provider: Provider, block: BlockParams<TransactionResponseParams>) => Block<TransactionResponse>) {
        super("org.ethers.network-plugins.custom-block");
        this.#blockFunc = blockFunc;
        this.#blockWithTxsFunc = blockWithTxsFunc;
    }

    async getBlock(provider: Provider, block: BlockParams<string>): Promise<Block<string>> {
        return await this.#blockFunc(provider, block);
    }

    async getBlockions(provider: Provider, block: BlockParams<TransactionResponseParams>): Promise<Block<TransactionResponse>> {
        return await this.#blockWithTxsFunc(provider, block);
    }

    clone(): CustomBlockNetworkPlugin {
        return new CustomBlockNetworkPlugin(this.#blockFunc, this.#blockWithTxsFunc);
    }
}
*/
//# sourceMappingURL=plugins-network.js.map
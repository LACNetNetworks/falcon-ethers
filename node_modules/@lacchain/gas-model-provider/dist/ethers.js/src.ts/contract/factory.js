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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractFactory = void 0;
const index_js_1 = require("../abi/index.js");
const index_js_2 = require("../address/index.js");
const index_js_3 = require("../utils/index.js");
const contract_js_1 = require("./contract.js");
// A = Arguments to the constructor
// I = Interface of deployed contracts
/**
 *  A **ContractFactory** is used to deploy a Contract to the blockchain.
 */
class ContractFactory {
    /**
     *  Create a new **ContractFactory** with %%abi%% and %%bytecode%%,
     *  optionally connected to %%runner%%.
     *
     *  The %%bytecode%% may be the ``bytecode`` property within the
     *  standard Solidity JSON output.
     */
    constructor(abi, bytecode, runner) {
        const iface = index_js_1.Interface.from(abi);
        // Dereference Solidity bytecode objects and allow a missing `0x`-prefix
        if (bytecode instanceof Uint8Array) {
            bytecode = (0, index_js_3.hexlify)((0, index_js_3.getBytes)(bytecode));
        }
        else {
            if (typeof (bytecode) === "object") {
                bytecode = bytecode.object;
            }
            if (!bytecode.startsWith("0x")) {
                bytecode = "0x" + bytecode;
            }
            bytecode = (0, index_js_3.hexlify)((0, index_js_3.getBytes)(bytecode));
        }
        (0, index_js_3.defineProperties)(this, {
            bytecode, interface: iface, runner: (runner || null)
        });
    }
    attach(target) {
        return new contract_js_1.BaseContract(target, this.interface, this.runner);
    }
    /**
     *  Resolves to the transaction to deploy the contract, passing %%args%%
     *  into the constructor.
     */
    getDeployTransaction(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            let overrides = {};
            const fragment = this.interface.deploy;
            if (fragment.inputs.length + 1 === args.length) {
                overrides = yield (0, contract_js_1.copyOverrides)(args.pop());
            }
            if (fragment.inputs.length !== args.length) {
                throw new Error("incorrect number of arguments to constructor");
            }
            const resolvedArgs = yield (0, contract_js_1.resolveArgs)(this.runner, fragment.inputs, args);
            const data = (0, index_js_3.concat)([this.bytecode, this.interface.encodeDeploy(resolvedArgs)]);
            return Object.assign({}, overrides, { data });
        });
    }
    /**
     *  Resolves to the Contract deployed by passing %%args%% into the
     *  constructor.
     *
     *  This will resovle to the Contract before it has been deployed to the
     *  network, so the [[BaseContract-waitForDeployment]] should be used before
     *  sending any transactions to it.
     */
    deploy(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this.getDeployTransaction(...args);
            (0, index_js_3.assert)(this.runner && typeof (this.runner.sendTransaction) === "function", "factory runner does not support sending transactions", "UNSUPPORTED_OPERATION", {
                operation: "sendTransaction"
            });
            const sentTx = yield this.runner.sendTransaction(tx);
            const address = (0, index_js_2.getCreateAddress)(sentTx);
            return new contract_js_1.BaseContract(address, this.interface, this.runner, sentTx);
        });
    }
    /**
     *  Return a new **ContractFactory** with the same ABI and bytecode,
     *  but connected to %%runner%%.
     */
    connect(runner) {
        return new ContractFactory(this.interface, this.bytecode, runner);
    }
    /**
     *  Create a new **ContractFactory** from the standard Solidity JSON output.
     */
    static fromSolidity(output, runner) {
        (0, index_js_3.assertArgument)(output != null, "bad compiler output", "output", output);
        if (typeof (output) === "string") {
            output = JSON.parse(output);
        }
        const abi = output.abi;
        let bytecode = "";
        if (output.bytecode) {
            bytecode = output.bytecode;
        }
        else if (output.evm && output.evm.bytecode) {
            bytecode = output.evm.bytecode;
        }
        return new this(abi, bytecode, runner);
    }
}
exports.ContractFactory = ContractFactory;
//# sourceMappingURL=factory.js.map
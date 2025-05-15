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
var _BrowserProvider_request;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserProvider = void 0;
const index_js_1 = require("../utils/index.js");
const provider_jsonrpc_js_1 = require("./provider-jsonrpc.js");
;
/**
 *  A **BrowserProvider** is intended to wrap an injected provider which
 *  adheres to the [[link-eip-1193]] standard, which most (if not all)
 *  currently do.
 */
class BrowserProvider extends provider_jsonrpc_js_1.JsonRpcApiPollingProvider {
    /**
     *  Connnect to the %%ethereum%% provider, optionally forcing the
     *  %%network%%.
     */
    constructor(ethereum, network) {
        super(network, { batchMaxCount: 1 });
        _BrowserProvider_request.set(this, void 0);
        __classPrivateFieldSet(this, _BrowserProvider_request, (method, params) => __awaiter(this, void 0, void 0, function* () {
            const payload = { method, params };
            this.emit("debug", { action: "sendEip1193Request", payload });
            try {
                const result = yield ethereum.request(payload);
                this.emit("debug", { action: "receiveEip1193Result", result });
                return result;
            }
            catch (e) {
                const error = new Error(e.message);
                error.code = e.code;
                error.data = e.data;
                error.payload = payload;
                this.emit("debug", { action: "receiveEip1193Error", error });
                throw error;
            }
        }), "f");
    }
    send(method, params) {
        const _super = Object.create(null, {
            send: { get: () => super.send }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield this._start();
            return yield _super.send.call(this, method, params);
        });
    }
    _send(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, index_js_1.assertArgument)(!Array.isArray(payload), "EIP-1193 does not support batch request", "payload", payload);
            try {
                const result = yield __classPrivateFieldGet(this, _BrowserProvider_request, "f").call(this, payload.method, payload.params || []);
                return [{ id: payload.id, result }];
            }
            catch (e) {
                return [{
                        id: payload.id,
                        error: { code: e.code, data: e.data, message: e.message }
                    }];
            }
        });
    }
    getRpcError(payload, error) {
        error = JSON.parse(JSON.stringify(error));
        // EIP-1193 gives us some machine-readable error codes, so rewrite
        // them into 
        switch (error.error.code || -1) {
            case 4001:
                error.error.message = `ethers-user-denied: ${error.error.message}`;
                break;
            case 4200:
                error.error.message = `ethers-unsupported: ${error.error.message}`;
                break;
        }
        return super.getRpcError(payload, error);
    }
    /**
     *  Resolves to ``true`` if the provider manages the %%address%%.
     */
    hasSigner(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (address == null) {
                address = 0;
            }
            const accounts = yield this.send("eth_accounts", []);
            if (typeof (address) === "number") {
                return (accounts.length > address);
            }
            address = address.toLowerCase();
            return accounts.filter((a) => (a.toLowerCase() === address)).length !== 0;
        });
    }
    getSigner(address) {
        const _super = Object.create(null, {
            getSigner: { get: () => super.getSigner }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (address == null) {
                address = 0;
            }
            if (!(yield this.hasSigner(address))) {
                try {
                    //const resp = 
                    yield __classPrivateFieldGet(this, _BrowserProvider_request, "f").call(this, "eth_requestAccounts", []);
                    //console.log("RESP", resp);
                }
                catch (error) {
                    const payload = error.payload;
                    throw this.getRpcError(payload, { id: payload.id, error });
                }
            }
            return yield _super.getSigner.call(this, address);
        });
    }
}
exports.BrowserProvider = BrowserProvider;
_BrowserProvider_request = new WeakMap();
//# sourceMappingURL=provider-browser.js.map
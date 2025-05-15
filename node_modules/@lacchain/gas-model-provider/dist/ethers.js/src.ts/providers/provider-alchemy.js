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
exports.AlchemyProvider = void 0;
/**
 *  About Alchemy
 *
 *  @_subsection: api/providers/thirdparty:Alchemy  [providers-alchemy]
 */
const index_js_1 = require("../utils/index.js");
const community_js_1 = require("./community.js");
const network_js_1 = require("./network.js");
const provider_jsonrpc_js_1 = require("./provider-jsonrpc.js");
const defaultApiKey = "_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC";
function getHost(name) {
    switch (name) {
        case "mainnet":
            return "eth-mainnet.alchemyapi.io";
        case "goerli":
            return "eth-goerli.g.alchemy.com";
        case "sepolia":
            return "eth-sepolia.g.alchemy.com";
        case "arbitrum":
            return "arb-mainnet.g.alchemy.com";
        case "arbitrum-goerli":
            return "arb-goerli.g.alchemy.com";
        case "base":
            return "base-mainnet.g.alchemy.com";
        case "base-goerli":
            return "base-goerli.g.alchemy.com";
        case "matic":
            return "polygon-mainnet.g.alchemy.com";
        case "matic-mumbai":
            return "polygon-mumbai.g.alchemy.com";
        case "optimism":
            return "opt-mainnet.g.alchemy.com";
        case "optimism-goerli":
            return "opt-goerli.g.alchemy.com";
    }
    (0, index_js_1.assertArgument)(false, "unsupported network", "network", name);
}
/**
 *  The **AlchemyProvider** connects to the [[link-alchemy]]
 *  JSON-RPC end-points.
 *
 *  By default, a highly-throttled API key is used, which is
 *  appropriate for quick prototypes and simple scripts. To
 *  gain access to an increased rate-limit, it is highly
 *  recommended to [sign up here](link-alchemy-signup).
 *
 *  @_docloc: api/providers/thirdparty
 */
class AlchemyProvider extends provider_jsonrpc_js_1.JsonRpcProvider {
    constructor(_network, apiKey) {
        if (_network == null) {
            _network = "mainnet";
        }
        const network = network_js_1.Network.from(_network);
        if (apiKey == null) {
            apiKey = defaultApiKey;
        }
        const request = AlchemyProvider.getRequest(network, apiKey);
        super(request, network, { staticNetwork: network });
        (0, index_js_1.defineProperties)(this, { apiKey });
    }
    _getProvider(chainId) {
        try {
            return new AlchemyProvider(chainId, this.apiKey);
        }
        catch (error) { }
        return super._getProvider(chainId);
    }
    _perform(req) {
        const _super = Object.create(null, {
            _perform: { get: () => super._perform }
        });
        return __awaiter(this, void 0, void 0, function* () {
            // https://docs.alchemy.com/reference/trace-transaction
            if (req.method === "getTransactionResult") {
                const { trace, tx } = yield (0, index_js_1.resolveProperties)({
                    trace: this.send("trace_transaction", [req.hash]),
                    tx: this.getTransaction(req.hash)
                });
                if (trace == null || tx == null) {
                    return null;
                }
                let data;
                let error = false;
                try {
                    data = trace[0].result.output;
                    error = (trace[0].error === "Reverted");
                }
                catch (error) { }
                if (data) {
                    (0, index_js_1.assert)(!error, "an error occurred during transaction executions", "CALL_EXCEPTION", {
                        action: "getTransactionResult",
                        data,
                        reason: null,
                        transaction: tx,
                        invocation: null,
                        revert: null // @TODO
                    });
                    return data;
                }
                (0, index_js_1.assert)(false, "could not parse trace result", "BAD_DATA", { value: trace });
            }
            return yield _super._perform.call(this, req);
        });
    }
    isCommunityResource() {
        return (this.apiKey === defaultApiKey);
    }
    static getRequest(network, apiKey) {
        if (apiKey == null) {
            apiKey = defaultApiKey;
        }
        const request = new index_js_1.FetchRequest(`https:/\/${getHost(network.name)}/v2/${apiKey}`);
        request.allowGzip = true;
        if (apiKey === defaultApiKey) {
            request.retryFunc = (request, response, attempt) => __awaiter(this, void 0, void 0, function* () {
                (0, community_js_1.showThrottleMessage)("alchemy");
                return true;
            });
        }
        return request;
    }
}
exports.AlchemyProvider = AlchemyProvider;
//# sourceMappingURL=provider-alchemy.js.map
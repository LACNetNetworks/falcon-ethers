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
exports.getUrl = exports.createGetUrl = void 0;
const errors_js_1 = require("./errors.js");
// @TODO: timeout is completely ignored; start a Promise.any with a reject?
function createGetUrl(options) {
    function getUrl(req, _signal) {
        return __awaiter(this, void 0, void 0, function* () {
            const protocol = req.url.split(":")[0].toLowerCase();
            (0, errors_js_1.assert)(protocol === "http" || protocol === "https", `unsupported protocol ${protocol}`, "UNSUPPORTED_OPERATION", {
                info: { protocol },
                operation: "request"
            });
            (0, errors_js_1.assert)(protocol === "https" || !req.credentials || req.allowInsecureAuthentication, "insecure authorized connections unsupported", "UNSUPPORTED_OPERATION", {
                operation: "request"
            });
            let signal = undefined;
            if (_signal) {
                const controller = new AbortController();
                signal = controller.signal;
                _signal.addListener(() => { controller.abort(); });
            }
            const init = {
                method: req.method,
                headers: new Headers(Array.from(req)),
                body: req.body || undefined,
                signal
            };
            const resp = yield fetch(req.url, init);
            const headers = {};
            resp.headers.forEach((value, key) => {
                headers[key.toLowerCase()] = value;
            });
            const respBody = yield resp.arrayBuffer();
            const body = (respBody == null) ? null : new Uint8Array(respBody);
            return {
                statusCode: resp.status,
                statusMessage: resp.statusText,
                headers, body
            };
        });
    }
    return getUrl;
}
exports.createGetUrl = createGetUrl;
// @TODO: remove in v7; provided for backwards compat
const defaultGetUrl = createGetUrl({});
function getUrl(req, _signal) {
    return __awaiter(this, void 0, void 0, function* () {
        return defaultGetUrl(req, _signal);
    });
}
exports.getUrl = getUrl;
//# sourceMappingURL=geturl-browser.js.map
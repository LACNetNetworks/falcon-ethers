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
var _FetchCancelSignal_listeners, _FetchCancelSignal_cancelled, _FetchRequest_instances, _FetchRequest_allowInsecure, _FetchRequest_gzip, _FetchRequest_headers, _FetchRequest_method, _FetchRequest_timeout, _FetchRequest_url, _FetchRequest_body, _FetchRequest_bodyType, _FetchRequest_creds, _FetchRequest_preflight, _FetchRequest_process, _FetchRequest_retry, _FetchRequest_signal, _FetchRequest_throttle, _FetchRequest_getUrlFunc, _FetchRequest_send, _FetchResponse_statusCode, _FetchResponse_statusMessage, _FetchResponse_headers, _FetchResponse_body, _FetchResponse_request, _FetchResponse_error;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchResponse = exports.FetchRequest = exports.FetchCancelSignal = void 0;
/**
 *  Fetching content from the web is environment-specific, so Ethers
 *  provides an abstraction that each environment can implement to provide
 *  this service.
 *
 *  On [Node.js](link-node), the ``http`` and ``https`` libs are used to
 *  create a request object, register event listeners and process data
 *  and populate the [[FetchResponse]].
 *
 *  In a browser, the [DOM fetch](link-js-fetch) is used, and the resulting
 *  ``Promise`` is waited on to retrieve the payload.
 *
 *  The [[FetchRequest]] is responsible for handling many common situations,
 *  such as redirects, server throttling, authentication, etc.
 *
 *  It also handles common gateways, such as IPFS and data URIs.
 *
 *  @_section api/utils/fetching:Fetching Web Content  [about-fetch]
 */
const base64_js_1 = require("./base64.js");
const data_js_1 = require("./data.js");
const errors_js_1 = require("./errors.js");
const properties_js_1 = require("./properties.js");
const utf8_js_1 = require("./utf8.js");
const geturl_js_1 = require("./geturl.js");
const MAX_ATTEMPTS = 12;
const SLOT_INTERVAL = 250;
// The global FetchGetUrlFunc implementation.
let defaultGetUrlFunc = (0, geturl_js_1.createGetUrl)();
const reData = new RegExp("^data:([^;:]*)?(;base64)?,(.*)$", "i");
const reIpfs = new RegExp("^ipfs:/\/(ipfs/)?(.*)$", "i");
// If locked, new Gateways cannot be added
let locked = false;
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
function dataGatewayFunc(url, signal) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const match = url.match(reData);
            if (!match) {
                throw new Error("invalid data");
            }
            return new FetchResponse(200, "OK", {
                "content-type": (match[1] || "text/plain"),
            }, (match[2] ? (0, base64_js_1.decodeBase64)(match[3]) : unpercent(match[3])));
        }
        catch (error) {
            return new FetchResponse(599, "BAD REQUEST (invalid data: URI)", {}, null, new FetchRequest(url));
        }
    });
}
/**
 *  Returns a [[FetchGatewayFunc]] for fetching content from a standard
 *  IPFS gateway hosted at %%baseUrl%%.
 */
function getIpfsGatewayFunc(baseUrl) {
    function gatewayIpfs(url, signal) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const match = url.match(reIpfs);
                if (!match) {
                    throw new Error("invalid link");
                }
                return new FetchRequest(`${baseUrl}${match[2]}`);
            }
            catch (error) {
                return new FetchResponse(599, "BAD REQUEST (invalid IPFS URI)", {}, null, new FetchRequest(url));
            }
        });
    }
    return gatewayIpfs;
}
const Gateways = {
    "data": dataGatewayFunc,
    "ipfs": getIpfsGatewayFunc("https:/\/gateway.ipfs.io/ipfs/")
};
const fetchSignals = new WeakMap();
/**
 *  @_ignore
 */
class FetchCancelSignal {
    constructor(request) {
        _FetchCancelSignal_listeners.set(this, void 0);
        _FetchCancelSignal_cancelled.set(this, void 0);
        __classPrivateFieldSet(this, _FetchCancelSignal_listeners, [], "f");
        __classPrivateFieldSet(this, _FetchCancelSignal_cancelled, false, "f");
        fetchSignals.set(request, () => {
            if (__classPrivateFieldGet(this, _FetchCancelSignal_cancelled, "f")) {
                return;
            }
            __classPrivateFieldSet(this, _FetchCancelSignal_cancelled, true, "f");
            for (const listener of __classPrivateFieldGet(this, _FetchCancelSignal_listeners, "f")) {
                setTimeout(() => { listener(); }, 0);
            }
            __classPrivateFieldSet(this, _FetchCancelSignal_listeners, [], "f");
        });
    }
    addListener(listener) {
        (0, errors_js_1.assert)(!__classPrivateFieldGet(this, _FetchCancelSignal_cancelled, "f"), "singal already cancelled", "UNSUPPORTED_OPERATION", {
            operation: "fetchCancelSignal.addCancelListener"
        });
        __classPrivateFieldGet(this, _FetchCancelSignal_listeners, "f").push(listener);
    }
    get cancelled() { return __classPrivateFieldGet(this, _FetchCancelSignal_cancelled, "f"); }
    checkSignal() {
        (0, errors_js_1.assert)(!this.cancelled, "cancelled", "CANCELLED", {});
    }
}
exports.FetchCancelSignal = FetchCancelSignal;
_FetchCancelSignal_listeners = new WeakMap(), _FetchCancelSignal_cancelled = new WeakMap();
// Check the signal, throwing if it is cancelled
function checkSignal(signal) {
    if (signal == null) {
        throw new Error("missing signal; should not happen");
    }
    signal.checkSignal();
    return signal;
}
/**
 *  Represents a request for a resource using a URI.
 *
 *  By default, the supported schemes are ``HTTP``, ``HTTPS``, ``data:``,
 *  and ``IPFS:``.
 *
 *  Additional schemes can be added globally using [[registerGateway]].
 *
 *  @example:
 *    req = new FetchRequest("https://www.ricmoo.com")
 *    resp = await req.send()
 *    resp.body.length
 *    //_result:
 */
class FetchRequest {
    /**
     *  The fetch URL to request.
     */
    get url() { return __classPrivateFieldGet(this, _FetchRequest_url, "f"); }
    set url(url) {
        __classPrivateFieldSet(this, _FetchRequest_url, String(url), "f");
    }
    /**
     *  The fetch body, if any, to send as the request body. //(default: null)//
     *
     *  When setting a body, the intrinsic ``Content-Type`` is automatically
     *  set and will be used if **not overridden** by setting a custom
     *  header.
     *
     *  If %%body%% is null, the body is cleared (along with the
     *  intrinsic ``Content-Type``).
     *
     *  If %%body%% is a string, the intrinsic ``Content-Type`` is set to
     *  ``text/plain``.
     *
     *  If %%body%% is a Uint8Array, the intrinsic ``Content-Type`` is set to
     *  ``application/octet-stream``.
     *
     *  If %%body%% is any other object, the intrinsic ``Content-Type`` is
     *  set to ``application/json``.
     */
    get body() {
        if (__classPrivateFieldGet(this, _FetchRequest_body, "f") == null) {
            return null;
        }
        return new Uint8Array(__classPrivateFieldGet(this, _FetchRequest_body, "f"));
    }
    set body(body) {
        if (body == null) {
            __classPrivateFieldSet(this, _FetchRequest_body, undefined, "f");
            __classPrivateFieldSet(this, _FetchRequest_bodyType, undefined, "f");
        }
        else if (typeof (body) === "string") {
            __classPrivateFieldSet(this, _FetchRequest_body, (0, utf8_js_1.toUtf8Bytes)(body), "f");
            __classPrivateFieldSet(this, _FetchRequest_bodyType, "text/plain", "f");
        }
        else if (body instanceof Uint8Array) {
            __classPrivateFieldSet(this, _FetchRequest_body, body, "f");
            __classPrivateFieldSet(this, _FetchRequest_bodyType, "application/octet-stream", "f");
        }
        else if (typeof (body) === "object") {
            __classPrivateFieldSet(this, _FetchRequest_body, (0, utf8_js_1.toUtf8Bytes)(JSON.stringify(body)), "f");
            __classPrivateFieldSet(this, _FetchRequest_bodyType, "application/json", "f");
        }
        else {
            throw new Error("invalid body");
        }
    }
    /**
     *  Returns true if the request has a body.
     */
    hasBody() {
        return (__classPrivateFieldGet(this, _FetchRequest_body, "f") != null);
    }
    /**
     *  The HTTP method to use when requesting the URI. If no method
     *  has been explicitly set, then ``GET`` is used if the body is
     *  null and ``POST`` otherwise.
     */
    get method() {
        if (__classPrivateFieldGet(this, _FetchRequest_method, "f")) {
            return __classPrivateFieldGet(this, _FetchRequest_method, "f");
        }
        if (this.hasBody()) {
            return "POST";
        }
        return "GET";
    }
    set method(method) {
        if (method == null) {
            method = "";
        }
        __classPrivateFieldSet(this, _FetchRequest_method, String(method).toUpperCase(), "f");
    }
    /**
     *  The headers that will be used when requesting the URI. All
     *  keys are lower-case.
     *
     *  This object is a copy, so any changes will **NOT** be reflected
     *  in the ``FetchRequest``.
     *
     *  To set a header entry, use the ``setHeader`` method.
     */
    get headers() {
        const headers = Object.assign({}, __classPrivateFieldGet(this, _FetchRequest_headers, "f"));
        if (__classPrivateFieldGet(this, _FetchRequest_creds, "f")) {
            headers["authorization"] = `Basic ${(0, base64_js_1.encodeBase64)((0, utf8_js_1.toUtf8Bytes)(__classPrivateFieldGet(this, _FetchRequest_creds, "f")))}`;
        }
        ;
        if (this.allowGzip) {
            headers["accept-encoding"] = "gzip";
        }
        if (headers["content-type"] == null && __classPrivateFieldGet(this, _FetchRequest_bodyType, "f")) {
            headers["content-type"] = __classPrivateFieldGet(this, _FetchRequest_bodyType, "f");
        }
        if (this.body) {
            headers["content-length"] = String(this.body.length);
        }
        return headers;
    }
    /**
     *  Get the header for %%key%%, ignoring case.
     */
    getHeader(key) {
        return this.headers[key.toLowerCase()];
    }
    /**
     *  Set the header for %%key%% to %%value%%. All values are coerced
     *  to a string.
     */
    setHeader(key, value) {
        __classPrivateFieldGet(this, _FetchRequest_headers, "f")[String(key).toLowerCase()] = String(value);
    }
    /**
     *  Clear all headers, resetting all intrinsic headers.
     */
    clearHeaders() {
        __classPrivateFieldSet(this, _FetchRequest_headers, {}, "f");
    }
    [(_FetchRequest_allowInsecure = new WeakMap(), _FetchRequest_gzip = new WeakMap(), _FetchRequest_headers = new WeakMap(), _FetchRequest_method = new WeakMap(), _FetchRequest_timeout = new WeakMap(), _FetchRequest_url = new WeakMap(), _FetchRequest_body = new WeakMap(), _FetchRequest_bodyType = new WeakMap(), _FetchRequest_creds = new WeakMap(), _FetchRequest_preflight = new WeakMap(), _FetchRequest_process = new WeakMap(), _FetchRequest_retry = new WeakMap(), _FetchRequest_signal = new WeakMap(), _FetchRequest_throttle = new WeakMap(), _FetchRequest_getUrlFunc = new WeakMap(), _FetchRequest_instances = new WeakSet(), Symbol.iterator)]() {
        const headers = this.headers;
        const keys = Object.keys(headers);
        let index = 0;
        return {
            next: () => {
                if (index < keys.length) {
                    const key = keys[index++];
                    return {
                        value: [key, headers[key]], done: false
                    };
                }
                return { value: undefined, done: true };
            }
        };
    }
    /**
     *  The value that will be sent for the ``Authorization`` header.
     *
     *  To set the credentials, use the ``setCredentials`` method.
     */
    get credentials() {
        return __classPrivateFieldGet(this, _FetchRequest_creds, "f") || null;
    }
    /**
     *  Sets an ``Authorization`` for %%username%% with %%password%%.
     */
    setCredentials(username, password) {
        (0, errors_js_1.assertArgument)(!username.match(/:/), "invalid basic authentication username", "username", "[REDACTED]");
        __classPrivateFieldSet(this, _FetchRequest_creds, `${username}:${password}`, "f");
    }
    /**
     *  Enable and request gzip-encoded responses. The response will
     *  automatically be decompressed. //(default: true)//
     */
    get allowGzip() {
        return __classPrivateFieldGet(this, _FetchRequest_gzip, "f");
    }
    set allowGzip(value) {
        __classPrivateFieldSet(this, _FetchRequest_gzip, !!value, "f");
    }
    /**
     *  Allow ``Authentication`` credentials to be sent over insecure
     *  channels. //(default: false)//
     */
    get allowInsecureAuthentication() {
        return !!__classPrivateFieldGet(this, _FetchRequest_allowInsecure, "f");
    }
    set allowInsecureAuthentication(value) {
        __classPrivateFieldSet(this, _FetchRequest_allowInsecure, !!value, "f");
    }
    /**
     *  The timeout (in milliseconds) to wait for a complete response.
     *  //(default: 5 minutes)//
     */
    get timeout() { return __classPrivateFieldGet(this, _FetchRequest_timeout, "f"); }
    set timeout(timeout) {
        (0, errors_js_1.assertArgument)(timeout >= 0, "timeout must be non-zero", "timeout", timeout);
        __classPrivateFieldSet(this, _FetchRequest_timeout, timeout, "f");
    }
    /**
     *  This function is called prior to each request, for example
     *  during a redirection or retry in case of server throttling.
     *
     *  This offers an opportunity to populate headers or update
     *  content before sending a request.
     */
    get preflightFunc() {
        return __classPrivateFieldGet(this, _FetchRequest_preflight, "f") || null;
    }
    set preflightFunc(preflight) {
        __classPrivateFieldSet(this, _FetchRequest_preflight, preflight, "f");
    }
    /**
     *  This function is called after each response, offering an
     *  opportunity to provide client-level throttling or updating
     *  response data.
     *
     *  Any error thrown in this causes the ``send()`` to throw.
     *
     *  To schedule a retry attempt (assuming the maximum retry limit
     *  has not been reached), use [[response.throwThrottleError]].
     */
    get processFunc() {
        return __classPrivateFieldGet(this, _FetchRequest_process, "f") || null;
    }
    set processFunc(process) {
        __classPrivateFieldSet(this, _FetchRequest_process, process, "f");
    }
    /**
     *  This function is called on each retry attempt.
     */
    get retryFunc() {
        return __classPrivateFieldGet(this, _FetchRequest_retry, "f") || null;
    }
    set retryFunc(retry) {
        __classPrivateFieldSet(this, _FetchRequest_retry, retry, "f");
    }
    /**
     *  This function is called to fetch content from HTTP and
     *  HTTPS URLs and is platform specific (e.g. nodejs vs
     *  browsers).
     *
     *  This is by default the currently registered global getUrl
     *  function, which can be changed using [[registerGetUrl]].
     *  If this has been set, setting is to ``null`` will cause
     *  this FetchRequest (and any future clones) to revert back to
     *  using the currently registered global getUrl function.
     *
     *  Setting this is generally not necessary, but may be useful
     *  for developers that wish to intercept requests or to
     *  configurege a proxy or other agent.
     */
    get getUrlFunc() {
        return __classPrivateFieldGet(this, _FetchRequest_getUrlFunc, "f") || defaultGetUrlFunc;
    }
    set getUrlFunc(value) {
        __classPrivateFieldSet(this, _FetchRequest_getUrlFunc, value, "f");
    }
    /**
     *  Create a new FetchRequest instance with default values.
     *
     *  Once created, each property may be set before issuing a
     *  ``.send()`` to make the request.
     */
    constructor(url) {
        _FetchRequest_instances.add(this);
        _FetchRequest_allowInsecure.set(this, void 0);
        _FetchRequest_gzip.set(this, void 0);
        _FetchRequest_headers.set(this, void 0);
        _FetchRequest_method.set(this, void 0);
        _FetchRequest_timeout.set(this, void 0);
        _FetchRequest_url.set(this, void 0);
        _FetchRequest_body.set(this, void 0);
        _FetchRequest_bodyType.set(this, void 0);
        _FetchRequest_creds.set(this, void 0);
        // Hooks
        _FetchRequest_preflight.set(this, void 0);
        _FetchRequest_process.set(this, void 0);
        _FetchRequest_retry.set(this, void 0);
        _FetchRequest_signal.set(this, void 0);
        _FetchRequest_throttle.set(this, void 0);
        _FetchRequest_getUrlFunc.set(this, void 0);
        __classPrivateFieldSet(this, _FetchRequest_url, String(url), "f");
        __classPrivateFieldSet(this, _FetchRequest_allowInsecure, false, "f");
        __classPrivateFieldSet(this, _FetchRequest_gzip, true, "f");
        __classPrivateFieldSet(this, _FetchRequest_headers, {}, "f");
        __classPrivateFieldSet(this, _FetchRequest_method, "", "f");
        __classPrivateFieldSet(this, _FetchRequest_timeout, 300000, "f");
        __classPrivateFieldSet(this, _FetchRequest_throttle, {
            slotInterval: SLOT_INTERVAL,
            maxAttempts: MAX_ATTEMPTS
        }, "f");
        __classPrivateFieldSet(this, _FetchRequest_getUrlFunc, null, "f");
    }
    toString() {
        return `<FetchRequest method=${JSON.stringify(this.method)} url=${JSON.stringify(this.url)} headers=${JSON.stringify(this.headers)} body=${__classPrivateFieldGet(this, _FetchRequest_body, "f") ? (0, data_js_1.hexlify)(__classPrivateFieldGet(this, _FetchRequest_body, "f")) : "null"}>`;
    }
    /**
     *  Update the throttle parameters used to determine maximum
     *  attempts and exponential-backoff properties.
     */
    setThrottleParams(params) {
        if (params.slotInterval != null) {
            __classPrivateFieldGet(this, _FetchRequest_throttle, "f").slotInterval = params.slotInterval;
        }
        if (params.maxAttempts != null) {
            __classPrivateFieldGet(this, _FetchRequest_throttle, "f").maxAttempts = params.maxAttempts;
        }
    }
    /**
     *  Resolves to the response by sending the request.
     */
    send() {
        (0, errors_js_1.assert)(__classPrivateFieldGet(this, _FetchRequest_signal, "f") == null, "request already sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.send" });
        __classPrivateFieldSet(this, _FetchRequest_signal, new FetchCancelSignal(this), "f");
        return __classPrivateFieldGet(this, _FetchRequest_instances, "m", _FetchRequest_send).call(this, 0, getTime() + this.timeout, 0, this, new FetchResponse(0, "", {}, null, this));
    }
    /**
     *  Cancels the inflight response, causing a ``CANCELLED``
     *  error to be rejected from the [[send]].
     */
    cancel() {
        (0, errors_js_1.assert)(__classPrivateFieldGet(this, _FetchRequest_signal, "f") != null, "request has not been sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.cancel" });
        const signal = fetchSignals.get(this);
        if (!signal) {
            throw new Error("missing signal; should not happen");
        }
        signal();
    }
    /**
     *  Returns a new [[FetchRequest]] that represents the redirection
     *  to %%location%%.
     */
    redirect(location) {
        // Redirection; for now we only support absolute locations
        const current = this.url.split(":")[0].toLowerCase();
        const target = location.split(":")[0].toLowerCase();
        // Don't allow redirecting:
        // - non-GET requests
        // - downgrading the security (e.g. https => http)
        // - to non-HTTP (or non-HTTPS) protocols [this could be relaxed?]
        (0, errors_js_1.assert)(this.method === "GET" && (current !== "https" || target !== "http") && location.match(/^https?:/), `unsupported redirect`, "UNSUPPORTED_OPERATION", {
            operation: `redirect(${this.method} ${JSON.stringify(this.url)} => ${JSON.stringify(location)})`
        });
        // Create a copy of this request, with a new URL
        const req = new FetchRequest(location);
        req.method = "GET";
        req.allowGzip = this.allowGzip;
        req.timeout = this.timeout;
        __classPrivateFieldSet(req, _FetchRequest_headers, Object.assign({}, __classPrivateFieldGet(this, _FetchRequest_headers, "f")), "f");
        if (__classPrivateFieldGet(this, _FetchRequest_body, "f")) {
            __classPrivateFieldSet(req, _FetchRequest_body, new Uint8Array(__classPrivateFieldGet(this, _FetchRequest_body, "f")), "f");
        }
        __classPrivateFieldSet(req, _FetchRequest_bodyType, __classPrivateFieldGet(this, _FetchRequest_bodyType, "f"), "f");
        // Do not forward credentials unless on the same domain; only absolute
        //req.allowInsecure = false;
        // paths are currently supported; may want a way to specify to forward?
        //setStore(req.#props, "creds", getStore(this.#pros, "creds"));
        return req;
    }
    /**
     *  Create a new copy of this request.
     */
    clone() {
        const clone = new FetchRequest(this.url);
        // Preserve "default method" (i.e. null)
        __classPrivateFieldSet(clone, _FetchRequest_method, __classPrivateFieldGet(this, _FetchRequest_method, "f"), "f");
        // Preserve "default body" with type, copying the Uint8Array is present
        if (__classPrivateFieldGet(this, _FetchRequest_body, "f")) {
            __classPrivateFieldSet(clone, _FetchRequest_body, __classPrivateFieldGet(this, _FetchRequest_body, "f"), "f");
        }
        __classPrivateFieldSet(clone, _FetchRequest_bodyType, __classPrivateFieldGet(this, _FetchRequest_bodyType, "f"), "f");
        // Preserve "default headers"
        __classPrivateFieldSet(clone, _FetchRequest_headers, Object.assign({}, __classPrivateFieldGet(this, _FetchRequest_headers, "f")), "f");
        // Credentials is readonly, so we copy internally
        __classPrivateFieldSet(clone, _FetchRequest_creds, __classPrivateFieldGet(this, _FetchRequest_creds, "f"), "f");
        if (this.allowGzip) {
            clone.allowGzip = true;
        }
        clone.timeout = this.timeout;
        if (this.allowInsecureAuthentication) {
            clone.allowInsecureAuthentication = true;
        }
        __classPrivateFieldSet(clone, _FetchRequest_preflight, __classPrivateFieldGet(this, _FetchRequest_preflight, "f"), "f");
        __classPrivateFieldSet(clone, _FetchRequest_process, __classPrivateFieldGet(this, _FetchRequest_process, "f"), "f");
        __classPrivateFieldSet(clone, _FetchRequest_retry, __classPrivateFieldGet(this, _FetchRequest_retry, "f"), "f");
        __classPrivateFieldSet(clone, _FetchRequest_getUrlFunc, __classPrivateFieldGet(this, _FetchRequest_getUrlFunc, "f"), "f");
        return clone;
    }
    /**
     *  Locks all static configuration for gateways and FetchGetUrlFunc
     *  registration.
     */
    static lockConfig() {
        locked = true;
    }
    /**
     *  Get the current Gateway function for %%scheme%%.
     */
    static getGateway(scheme) {
        return Gateways[scheme.toLowerCase()] || null;
    }
    /**
     *  Use the %%func%% when fetching URIs using %%scheme%%.
     *
     *  This method affects all requests globally.
     *
     *  If [[lockConfig]] has been called, no change is made and this
     *  throws.
     */
    static registerGateway(scheme, func) {
        scheme = scheme.toLowerCase();
        if (scheme === "http" || scheme === "https") {
            throw new Error(`cannot intercept ${scheme}; use registerGetUrl`);
        }
        if (locked) {
            throw new Error("gateways locked");
        }
        Gateways[scheme] = func;
    }
    /**
     *  Use %%getUrl%% when fetching URIs over HTTP and HTTPS requests.
     *
     *  This method affects all requests globally.
     *
     *  If [[lockConfig]] has been called, no change is made and this
     *  throws.
     */
    static registerGetUrl(getUrl) {
        if (locked) {
            throw new Error("gateways locked");
        }
        defaultGetUrlFunc = getUrl;
    }
    /**
     *  Creates a getUrl function that fetches content from HTTP and
     *  HTTPS URLs.
     *
     *  The available %%options%% are dependent on the platform
     *  implementation of the default getUrl function.
     *
     *  This is not generally something that is needed, but is useful
     *  when trying to customize simple behaviour when fetching HTTP
     *  content.
     */
    static createGetUrlFunc(options) {
        return (0, geturl_js_1.createGetUrl)(options);
    }
    /**
     *  Creates a function that can "fetch" data URIs.
     *
     *  Note that this is automatically done internally to support
     *  data URIs, so it is not necessary to register it.
     *
     *  This is not generally something that is needed, but may
     *  be useful in a wrapper to perfom custom data URI functionality.
     */
    static createDataGateway() {
        return dataGatewayFunc;
    }
    /**
     *  Creates a function that will fetch IPFS (unvalidated) from
     *  a custom gateway baseUrl.
     *
     *  The default IPFS gateway used internally is
     *  ``"https:/\/gateway.ipfs.io/ipfs/"``.
     */
    static createIpfsGatewayFunc(baseUrl) {
        return getIpfsGatewayFunc(baseUrl);
    }
}
exports.FetchRequest = FetchRequest;
_FetchRequest_send = function _FetchRequest_send(attempt, expires, delay, _request, _response) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        if (attempt >= __classPrivateFieldGet(this, _FetchRequest_throttle, "f").maxAttempts) {
            return _response.makeServerError("exceeded maximum retry limit");
        }
        (0, errors_js_1.assert)(getTime() <= expires, "timeout", "TIMEOUT", {
            operation: "request.send", reason: "timeout", request: _request
        });
        if (delay > 0) {
            yield wait(delay);
        }
        let req = this.clone();
        const scheme = (req.url.split(":")[0] || "").toLowerCase();
        // Process any Gateways
        if (scheme in Gateways) {
            const result = yield Gateways[scheme](req.url, checkSignal(__classPrivateFieldGet(_request, _FetchRequest_signal, "f")));
            if (result instanceof FetchResponse) {
                let response = result;
                if (this.processFunc) {
                    checkSignal(__classPrivateFieldGet(_request, _FetchRequest_signal, "f"));
                    try {
                        response = yield this.processFunc(req, response);
                    }
                    catch (error) {
                        // Something went wrong during processing; throw a 5xx server error
                        if (error.throttle == null || typeof (error.stall) !== "number") {
                            response.makeServerError("error in post-processing function", error).assertOk();
                        }
                        // Ignore throttling
                    }
                }
                return response;
            }
            req = result;
        }
        // We have a preflight function; update the request
        if (this.preflightFunc) {
            req = yield this.preflightFunc(req);
        }
        const resp = yield this.getUrlFunc(req, checkSignal(__classPrivateFieldGet(_request, _FetchRequest_signal, "f")));
        let response = new FetchResponse(resp.statusCode, resp.statusMessage, resp.headers, resp.body, _request);
        if (response.statusCode === 301 || response.statusCode === 302) {
            // Redirect
            try {
                const location = response.headers.location || "";
                return __classPrivateFieldGet((_a = req.redirect(location)), _FetchRequest_instances, "m", _FetchRequest_send).call(_a, attempt + 1, expires, 0, _request, response);
            }
            catch (error) { }
            // Things won't get any better on another attempt; abort
            return response;
        }
        else if (response.statusCode === 429) {
            // Throttle
            if (this.retryFunc == null || (yield this.retryFunc(req, response, attempt))) {
                const retryAfter = response.headers["retry-after"];
                let delay = __classPrivateFieldGet(this, _FetchRequest_throttle, "f").slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                if (typeof (retryAfter) === "string" && retryAfter.match(/^[1-9][0-9]*$/)) {
                    delay = parseInt(retryAfter);
                }
                return __classPrivateFieldGet((_b = req.clone()), _FetchRequest_instances, "m", _FetchRequest_send).call(_b, attempt + 1, expires, delay, _request, response);
            }
        }
        if (this.processFunc) {
            checkSignal(__classPrivateFieldGet(_request, _FetchRequest_signal, "f"));
            try {
                response = yield this.processFunc(req, response);
            }
            catch (error) {
                // Something went wrong during processing; throw a 5xx server error
                if (error.throttle == null || typeof (error.stall) !== "number") {
                    response.makeServerError("error in post-processing function", error).assertOk();
                }
                // Throttle
                let delay = __classPrivateFieldGet(this, _FetchRequest_throttle, "f").slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                ;
                if (error.stall >= 0) {
                    delay = error.stall;
                }
                return __classPrivateFieldGet((_c = req.clone()), _FetchRequest_instances, "m", _FetchRequest_send).call(_c, attempt + 1, expires, delay, _request, response);
            }
        }
        return response;
    });
};
;
/**
 *  The response for a FetchRequest.
 */
class FetchResponse {
    toString() {
        return `<FetchResponse status=${this.statusCode} body=${__classPrivateFieldGet(this, _FetchResponse_body, "f") ? (0, data_js_1.hexlify)(__classPrivateFieldGet(this, _FetchResponse_body, "f")) : "null"}>`;
    }
    /**
     *  The response status code.
     */
    get statusCode() { return __classPrivateFieldGet(this, _FetchResponse_statusCode, "f"); }
    /**
     *  The response status message.
     */
    get statusMessage() { return __classPrivateFieldGet(this, _FetchResponse_statusMessage, "f"); }
    /**
     *  The response headers. All keys are lower-case.
     */
    get headers() { return Object.assign({}, __classPrivateFieldGet(this, _FetchResponse_headers, "f")); }
    /**
     *  The response body, or ``null`` if there was no body.
     */
    get body() {
        return (__classPrivateFieldGet(this, _FetchResponse_body, "f") == null) ? null : new Uint8Array(__classPrivateFieldGet(this, _FetchResponse_body, "f"));
    }
    /**
     *  The response body as a UTF-8 encoded string, or the empty
     *  string (i.e. ``""``) if there was no body.
     *
     *  An error is thrown if the body is invalid UTF-8 data.
     */
    get bodyText() {
        try {
            return (__classPrivateFieldGet(this, _FetchResponse_body, "f") == null) ? "" : (0, utf8_js_1.toUtf8String)(__classPrivateFieldGet(this, _FetchResponse_body, "f"));
        }
        catch (error) {
            (0, errors_js_1.assert)(false, "response body is not valid UTF-8 data", "UNSUPPORTED_OPERATION", {
                operation: "bodyText", info: { response: this }
            });
        }
    }
    /**
     *  The response body, decoded as JSON.
     *
     *  An error is thrown if the body is invalid JSON-encoded data
     *  or if there was no body.
     */
    get bodyJson() {
        try {
            return JSON.parse(this.bodyText);
        }
        catch (error) {
            (0, errors_js_1.assert)(false, "response body is not valid JSON", "UNSUPPORTED_OPERATION", {
                operation: "bodyJson", info: { response: this }
            });
        }
    }
    [(_FetchResponse_statusCode = new WeakMap(), _FetchResponse_statusMessage = new WeakMap(), _FetchResponse_headers = new WeakMap(), _FetchResponse_body = new WeakMap(), _FetchResponse_request = new WeakMap(), _FetchResponse_error = new WeakMap(), Symbol.iterator)]() {
        const headers = this.headers;
        const keys = Object.keys(headers);
        let index = 0;
        return {
            next: () => {
                if (index < keys.length) {
                    const key = keys[index++];
                    return {
                        value: [key, headers[key]], done: false
                    };
                }
                return { value: undefined, done: true };
            }
        };
    }
    constructor(statusCode, statusMessage, headers, body, request) {
        _FetchResponse_statusCode.set(this, void 0);
        _FetchResponse_statusMessage.set(this, void 0);
        _FetchResponse_headers.set(this, void 0);
        _FetchResponse_body.set(this, void 0);
        _FetchResponse_request.set(this, void 0);
        _FetchResponse_error.set(this, void 0);
        __classPrivateFieldSet(this, _FetchResponse_statusCode, statusCode, "f");
        __classPrivateFieldSet(this, _FetchResponse_statusMessage, statusMessage, "f");
        __classPrivateFieldSet(this, _FetchResponse_headers, Object.keys(headers).reduce((accum, k) => {
            accum[k.toLowerCase()] = String(headers[k]);
            return accum;
        }, {}), "f");
        __classPrivateFieldSet(this, _FetchResponse_body, ((body == null) ? null : new Uint8Array(body)), "f");
        __classPrivateFieldSet(this, _FetchResponse_request, (request || null), "f");
        __classPrivateFieldSet(this, _FetchResponse_error, { message: "" }, "f");
    }
    /**
     *  Return a Response with matching headers and body, but with
     *  an error status code (i.e. 599) and %%message%% with an
     *  optional %%error%%.
     */
    makeServerError(message, error) {
        let statusMessage;
        if (!message) {
            message = `${this.statusCode} ${this.statusMessage}`;
            statusMessage = `CLIENT ESCALATED SERVER ERROR (${message})`;
        }
        else {
            statusMessage = `CLIENT ESCALATED SERVER ERROR (${this.statusCode} ${this.statusMessage}; ${message})`;
        }
        const response = new FetchResponse(599, statusMessage, this.headers, this.body, __classPrivateFieldGet(this, _FetchResponse_request, "f") || undefined);
        __classPrivateFieldSet(response, _FetchResponse_error, { message, error }, "f");
        return response;
    }
    /**
     *  If called within a [request.processFunc](FetchRequest-processFunc)
     *  call, causes the request to retry as if throttled for %%stall%%
     *  milliseconds.
     */
    throwThrottleError(message, stall) {
        if (stall == null) {
            stall = -1;
        }
        else {
            (0, errors_js_1.assertArgument)(Number.isInteger(stall) && stall >= 0, "invalid stall timeout", "stall", stall);
        }
        const error = new Error(message || "throttling requests");
        (0, properties_js_1.defineProperties)(error, { stall, throttle: true });
        throw error;
    }
    /**
     *  Get the header value for %%key%%, ignoring case.
     */
    getHeader(key) {
        return this.headers[key.toLowerCase()];
    }
    /**
     *  Returns true if the response has a body.
     */
    hasBody() {
        return (__classPrivateFieldGet(this, _FetchResponse_body, "f") != null);
    }
    /**
     *  The request made for this response.
     */
    get request() { return __classPrivateFieldGet(this, _FetchResponse_request, "f"); }
    /**
     *  Returns true if this response was a success statusCode.
     */
    ok() {
        return (__classPrivateFieldGet(this, _FetchResponse_error, "f").message === "" && this.statusCode >= 200 && this.statusCode < 300);
    }
    /**
     *  Throws a ``SERVER_ERROR`` if this response is not ok.
     */
    assertOk() {
        if (this.ok()) {
            return;
        }
        let { message, error } = __classPrivateFieldGet(this, _FetchResponse_error, "f");
        if (message === "") {
            message = `server response ${this.statusCode} ${this.statusMessage}`;
        }
        (0, errors_js_1.assert)(false, message, "SERVER_ERROR", {
            request: (this.request || "unknown request"), response: this, error
        });
    }
}
exports.FetchResponse = FetchResponse;
function getTime() { return (new Date()).getTime(); }
function unpercent(value) {
    return (0, utf8_js_1.toUtf8Bytes)(value.replace(/%([0-9a-f][0-9a-f])/gi, (all, code) => {
        return String.fromCharCode(parseInt(code, 16));
    }));
}
function wait(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}
//# sourceMappingURL=fetch.js.map
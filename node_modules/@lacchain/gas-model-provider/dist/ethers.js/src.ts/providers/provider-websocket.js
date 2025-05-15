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
var _WebSocketProvider_connect, _WebSocketProvider_websocket;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketProvider = void 0;
const ws_js_1 = require("./ws.js"); /*-browser*/
const provider_socket_js_1 = require("./provider-socket.js");
/**
 *  A JSON-RPC provider which is backed by a WebSocket.
 *
 *  WebSockets are often preferred because they retain a live connection
 *  to a server, which permits more instant access to events.
 *
 *  However, this incurs higher server infrasturture costs, so additional
 *  resources may be required to host your own WebSocket nodes and many
 *  third-party services charge additional fees for WebSocket endpoints.
 */
class WebSocketProvider extends provider_socket_js_1.SocketProvider {
    get websocket() {
        if (__classPrivateFieldGet(this, _WebSocketProvider_websocket, "f") == null) {
            throw new Error("websocket closed");
        }
        return __classPrivateFieldGet(this, _WebSocketProvider_websocket, "f");
    }
    constructor(url, network, options) {
        super(network, options);
        _WebSocketProvider_connect.set(this, void 0);
        _WebSocketProvider_websocket.set(this, void 0);
        if (typeof (url) === "string") {
            __classPrivateFieldSet(this, _WebSocketProvider_connect, () => { return new ws_js_1.WebSocket(url); }, "f");
            __classPrivateFieldSet(this, _WebSocketProvider_websocket, __classPrivateFieldGet(this, _WebSocketProvider_connect, "f").call(this), "f");
        }
        else if (typeof (url) === "function") {
            __classPrivateFieldSet(this, _WebSocketProvider_connect, url, "f");
            __classPrivateFieldSet(this, _WebSocketProvider_websocket, url(), "f");
        }
        else {
            __classPrivateFieldSet(this, _WebSocketProvider_connect, null, "f");
            __classPrivateFieldSet(this, _WebSocketProvider_websocket, url, "f");
        }
        this.websocket.onopen = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._start();
                this.resume();
            }
            catch (error) {
                console.log("failed to start WebsocketProvider", error);
                // @TODO: now what? Attempt reconnect?
            }
        });
        this.websocket.onmessage = (message) => {
            this._processMessage(message.data);
        };
        /*
                this.websocket.onclose = (event) => {
                    // @TODO: What event.code should we reconnect on?
                    const reconnect = false;
                    if (reconnect) {
                        this.pause(true);
                        if (this.#connect) {
                            this.#websocket = this.#connect();
                            this.#websocket.onopen = ...
                            // @TODO: this requires the super class to rebroadcast; move it there
                        }
                        this._reconnect();
                    }
                };
        */
    }
    _write(message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.websocket.send(message);
        });
    }
    destroy() {
        const _super = Object.create(null, {
            destroy: { get: () => super.destroy }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _WebSocketProvider_websocket, "f") != null) {
                __classPrivateFieldGet(this, _WebSocketProvider_websocket, "f").close();
                __classPrivateFieldSet(this, _WebSocketProvider_websocket, null, "f");
            }
            _super.destroy.call(this);
        });
    }
}
exports.WebSocketProvider = WebSocketProvider;
_WebSocketProvider_connect = new WeakMap(), _WebSocketProvider_websocket = new WeakMap();
//# sourceMappingURL=provider-websocket.js.map
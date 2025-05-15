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
var _IpcSocketProvider_socket;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpcSocketProvider = void 0;
const net_1 = require("net");
const provider_socket_js_1 = require("./provider-socket.js");
// @TODO: Is this sufficient? Is this robust? Will newlines occur between
// all payloads and only between payloads?
function splitBuffer(data) {
    const messages = [];
    let lastStart = 0;
    while (true) {
        const nl = data.indexOf(10, lastStart);
        if (nl === -1) {
            break;
        }
        messages.push(data.subarray(lastStart, nl).toString().trim());
        lastStart = nl + 1;
    }
    return { messages, remaining: data.subarray(lastStart) };
}
/**
 *  An **IpcSocketProvider** connects over an IPC socket on the host
 *  which provides fast access to the node, but requires the node and
 *  the script run on the same machine.
 */
class IpcSocketProvider extends provider_socket_js_1.SocketProvider {
    /**
     *  The connected socket.
     */
    get socket() { return __classPrivateFieldGet(this, _IpcSocketProvider_socket, "f"); }
    constructor(path, network, options) {
        super(network, options);
        _IpcSocketProvider_socket.set(this, void 0);
        __classPrivateFieldSet(this, _IpcSocketProvider_socket, (0, net_1.connect)(path), "f");
        this.socket.on("ready", () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._start();
            }
            catch (error) {
                console.log("failed to start IpcSocketProvider", error);
                // @TODO: Now what? Restart?
            }
        }));
        let response = Buffer.alloc(0);
        this.socket.on("data", (data) => {
            response = Buffer.concat([response, data]);
            const { messages, remaining } = splitBuffer(response);
            messages.forEach((message) => {
                this._processMessage(message);
            });
            response = remaining;
        });
        this.socket.on("end", () => {
            this.emit("close");
            this.socket.destroy();
            this.socket.end();
        });
    }
    destroy() {
        this.socket.destroy();
        this.socket.end();
        super.destroy();
    }
    _write(message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.socket.write(message);
        });
    }
}
exports.IpcSocketProvider = IpcSocketProvider;
_IpcSocketProvider_socket = new WeakMap();
//# sourceMappingURL=provider-ipcsocket.js.map
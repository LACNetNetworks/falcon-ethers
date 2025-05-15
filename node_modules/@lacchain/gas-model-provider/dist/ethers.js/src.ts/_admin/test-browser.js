"use strict";
/**
 *
 *
 *  Paths
 *  /index.js => dist/ethers.js
 *  /tests/utils.js => in-memory hijack
 *  /static/* => output/*
 *    - index.html
 *    - assert.js
 *  /tests/* => lib.esm/_tests/*
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _CDPSession_id, _CDPSession_resp, _CDPSession_readyOpen, _CDPSession_readyPage, _CDPSession_target, _CDPSession_session, _CDPSession_done, _CDPSession_exit;
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.CDPSession = exports.getMime = void 0;
// See: https://vanilla.aslushnikov.com/?Console
const fs_1 = __importDefault(require("fs"));
const child_process_1 = __importDefault(require("child_process"));
const zlib_1 = __importDefault(require("zlib"));
const ws_1 = require("ws");
const http_1 = require("http");
const path_1 = require("path");
const mimes = {
    css: "text/css",
    doctree: "application/x-doctree",
    eot: "application/vnd.ms-fontobject",
    gif: "image/gif",
    html: "text/html",
    ico: "image/x-icon",
    js: "application/javascript",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    json: "application/json",
    map: "application/json",
    md: "text/markdown",
    png: "image/png",
    svg: "image/svg+xml",
    ttf: "application/x-font-ttf",
    txt: "text/plain",
    woff: "application/font-woff"
};
function getMime(filename) {
    const mime = mimes[(filename.split('.').pop() || "").toLowerCase()];
    if (mime == null) {
        console.log(`WARN: NO MIME for ${filename}`);
        return "application/octet-stream";
    }
    return mime;
}
exports.getMime = getMime;
class CDPSession {
    constructor(url) {
        _CDPSession_id.set(this, void 0);
        _CDPSession_resp.set(this, void 0);
        _CDPSession_readyOpen.set(this, void 0);
        _CDPSession_readyPage.set(this, void 0);
        _CDPSession_target.set(this, void 0);
        _CDPSession_session.set(this, void 0);
        _CDPSession_done.set(this, void 0);
        _CDPSession_exit.set(this, void 0);
        this.websocket = new ws_1.WebSocket(url);
        __classPrivateFieldSet(this, _CDPSession_id, 1, "f");
        __classPrivateFieldSet(this, _CDPSession_resp, new Map(), "f");
        __classPrivateFieldSet(this, _CDPSession_exit, (status) => { }, "f");
        __classPrivateFieldSet(this, _CDPSession_done, new Promise((resolve) => {
            __classPrivateFieldSet(this, _CDPSession_exit, resolve, "f");
        }), "f");
        __classPrivateFieldSet(this, _CDPSession_target, "", "f");
        __classPrivateFieldSet(this, _CDPSession_session, "", "f");
        const readyOpen = new Promise((resolve, reject) => {
            this.websocket.onopen = () => __awaiter(this, void 0, void 0, function* () { resolve(); });
        });
        const readyPage = (() => __awaiter(this, void 0, void 0, function* () {
            yield readyOpen;
            const target = yield this._send("Target.getTargets", {});
            if (target.targetInfos.length) {
                __classPrivateFieldSet(this, _CDPSession_target, target.targetInfos[0].targetId, "f");
            }
            else {
                const target = yield this._send("Target.createTarget", { url: "" });
                __classPrivateFieldSet(this, _CDPSession_target, target.targetId, "f");
            }
            const attached = yield this._send("Target.attachToTarget", {
                targetId: __classPrivateFieldGet(this, _CDPSession_target, "f"),
                flatten: true
            });
            __classPrivateFieldSet(this, _CDPSession_session, attached.sessionId, "f");
        }))();
        __classPrivateFieldSet(this, _CDPSession_readyOpen, readyOpen, "f");
        __classPrivateFieldSet(this, _CDPSession_readyPage, readyPage, "f");
        this.websocket.onmessage = (_msg) => {
            const msg = JSON.parse(_msg.data);
            if (msg.id != null) {
                const responder = __classPrivateFieldGet(this, _CDPSession_resp, "f").get(msg.id);
                __classPrivateFieldGet(this, _CDPSession_resp, "f").delete(msg.id);
                if (responder == null) {
                    console.log("WARN: unknown request ${ msg.id }");
                    return;
                }
                if (msg.error) {
                    responder.reject(new Error(msg.error));
                }
                else {
                    responder.resolve(msg.result);
                }
            }
            else {
                if (msg.method === "Console.messageAdded") {
                    const text = msg.params.message.text;
                    if (text.startsWith("#status")) {
                        __classPrivateFieldGet(this, _CDPSession_exit, "f").call(this, parseInt(text.split("=").pop()));
                    }
                    console.log(text);
                    //console.log(msg.params.message.text, `${ msg.params.message.url }:${ msg.params.message.line }`);
                }
                else if (msg.method === "Target.attachedToTarget") {
                }
                else {
                    console.log(`WARN: Unhandled event - ${JSON.stringify(msg)}`);
                }
            }
        };
        this.websocket.onerror = (error) => {
            console.log(`WARN: WebSocket error - ${JSON.stringify(error)}`);
        };
    }
    get target() {
        return __classPrivateFieldGet(this, _CDPSession_target, "f");
    }
    get ready() {
        return (() => __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _CDPSession_readyOpen, "f");
            yield __classPrivateFieldGet(this, _CDPSession_readyPage, "f");
        }))();
    }
    get done() {
        return __classPrivateFieldGet(this, _CDPSession_done, "f");
    }
    send(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _CDPSession_readyOpen, "f");
            yield __classPrivateFieldGet(this, _CDPSession_readyPage, "f");
            return this._send(method, params);
        });
    }
    _send(method, params) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const id = (__classPrivateFieldSet(this, _CDPSession_id, (_b = __classPrivateFieldGet(this, _CDPSession_id, "f"), _a = _b++, _b), "f"), _a);
            const payload = { id, method, params };
            if (__classPrivateFieldGet(this, _CDPSession_session, "f")) {
                payload.sessionId = __classPrivateFieldGet(this, _CDPSession_session, "f");
            }
            this.websocket.send(JSON.stringify(payload));
            return new Promise((resolve, reject) => {
                __classPrivateFieldGet(this, _CDPSession_resp, "f").set(id, { resolve, reject });
            });
        });
    }
    navigate(url) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.send("Page.navigate", { url });
        });
    }
}
exports.CDPSession = CDPSession;
_CDPSession_id = new WeakMap(), _CDPSession_resp = new WeakMap(), _CDPSession_readyOpen = new WeakMap(), _CDPSession_readyPage = new WeakMap(), _CDPSession_target = new WeakMap(), _CDPSession_session = new WeakMap(), _CDPSession_done = new WeakMap(), _CDPSession_exit = new WeakMap();
const TestData = (function () {
    function load(tag) {
        const filename = (0, path_1.resolve)("testcases", tag + ".json.gz");
        const data = zlib_1.default.gunzipSync(fs_1.default.readFileSync(filename));
        return [String(data.length), zlib_1.default.deflateRawSync(data).toString("base64")].join(",");
    }
    let data = [];
    data.push(`import { ethers } from "/index.js";`);
    data.push(`import { inflate } from "/static/tiny-inflate.js";`);
    data.push(`const fs = new Map();`);
    for (const filename of fs_1.default.readdirSync("testcases")) {
        if (!filename.endsWith(".json.gz")) {
            continue;
        }
        const tag = filename.split(".")[0];
        data.push(`fs.set(${JSON.stringify(tag)}, ${JSON.stringify(load(tag))});`);
    }
    data.push(`export function loadTests(tag) {`);
    data.push(`  const data = fs.get(tag);`);
    data.push(`  if (data == null) { throw new Error("missing tag: " + tag); }`);
    data.push(`  const comps = data.split(",");`);
    data.push(`  const result = new Uint8Array(parseInt(comps[0]));`);
    data.push(`  inflate(ethers.decodeBase64(comps[1]), result);`);
    data.push(`  return JSON.parse(ethers.toUtf8String(result))`);
    data.push(`}`);
    return data.join("\n");
})();
function start(_root, options) {
    if (options == null) {
        options = {};
    }
    if (options.port == null) {
        options.port = 8000;
    }
    const server = (0, http_1.createServer)((req, resp) => {
        const url = (req.url || "").split("?")[0];
        let transform = false;
        let filename;
        if (url === "/") {
            filename = "./misc/test-browser/index.html";
        }
        else if (url === "/ethers.js" || url === "/index.js") {
            filename = "./dist/ethers.js";
        }
        else if (url === "/ethers.js.map") {
            filename = "./dist/ethers.js.map";
        }
        else if (url.startsWith("/static/")) {
            filename = "./misc/test-browser/" + url.substring(8);
        }
        else if (url === "/tests/utils.js") {
            //console.log({ status: 200, content: `<<in-memory ${ TestData.length } bytes>>` });
            resp.writeHead(200, {
                "Content-Length": TestData.length,
                "Content-Type": getMime("testdata.js")
            });
            resp.end(TestData);
            return;
        }
        else if (url.startsWith("/tests/")) {
            transform = true;
            filename = (0, path_1.join)("./lib.esm/_tests", url.substring(7));
        }
        else {
            //console.log("FALLBACK");
            filename = url.substring(1);
        }
        // Make sure we aren't crawling out of our sandbox
        if (url[0] !== "/" || filename.substring(0, filename.length) !== filename) {
            //console.log({ status: 403, reason: "escaping" });
            resp.writeHead(403);
            resp.end();
            return;
        }
        try {
            const stat = fs_1.default.statSync(filename);
            if (stat.isDirectory()) {
                // Redirect bare directory to its path (i.e. "/foo" => "/foo/")
                if (url[url.length - 1] !== "/") {
                    //console.log({ status: 301, location: (url + "/") });
                    resp.writeHead(301, { Location: url + "/" });
                    resp.end();
                    return;
                }
                filename += "/index.html";
            }
            let content = fs_1.default.readFileSync(filename);
            if (transform) {
                content = Buffer.from(content.toString().replace(/import ([^;]*) from "([^"]*)";/g, (all, names, filename) => {
                    switch (filename) {
                        case "assert":
                            //case "path":
                            //case "fs":
                            //case "zlib":
                            return `import ${names} from "/static/${filename}.js"`;
                    }
                    return all;
                }));
            }
            //console.log({ status: 200, filename });
            resp.writeHead(200, {
                "Content-Length": content.length,
                "Content-Type": getMime(filename)
            });
            resp.end(content);
            return;
        }
        catch (error) {
            if (error.code === "ENOENT") {
                //console.log({ status: 404, filename });
                console.log(`WARN: Not found - ${filename}`);
                resp.writeHead(404, {});
                resp.end();
                return;
            }
            //console.log({ status: 500, error: error.toString() });
            console.log(`WARN: Server error - ${error.toString()}`);
            resp.writeHead(500, {});
            resp.end();
            return;
        }
    });
    return new Promise((resolve, reject) => {
        server.listen(options.port, () => {
            console.log(`Server running on: http://localhost:${options.port}`);
            resolve(server);
        });
    });
}
exports.start = start;
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield start((0, path_1.resolve)("."), { port: 8000 });
        const cmds = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/usr/bin/chromium"
        ].filter((f) => { try {
            fs_1.default.accessSync(f);
            return true;
        }
        catch (error) {
            return false;
        } });
        if (cmds.length === 0) {
            throw new Error("no installed browser found");
        }
        const cmd = cmds[0];
        const args = ["--headless", "--disable-gpu", "--remote-debugging-port=8022"];
        const browser = child_process_1.default.spawn(cmd, args);
        let url = yield new Promise((resolve, reject) => {
            browser.stdout.on("data", (data) => {
                console.log("OUT", data.toString());
            });
            browser.stderr.on("data", (data) => {
                const text = data.toString();
                for (const line of text.split("\n")) {
                    const match = line.match(/^DevTools listening on (.*)$/);
                    if (match) {
                        resolve(match[1]);
                        return;
                    }
                }
            });
        });
        console.log("URL:", url);
        const session = new CDPSession(url);
        yield session.ready;
        yield session.send("Console.enable", {});
        yield session.navigate("http:/\/localhost:8000");
        const status = yield session.done;
        console.log("STATUS:", status);
        process.exit(status);
    });
})();
//# sourceMappingURL=test-browser.js.map
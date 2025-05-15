"use strict";
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
var _RunResult_cmd, _RunResult_status, _RunResult_stdout, _RunResult_stderr;
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.RunResult = void 0;
const child_process_1 = require("child_process");
class RunResult {
    constructor(progname, args, status, stdout, stderr) {
        _RunResult_cmd.set(this, void 0);
        _RunResult_status.set(this, void 0);
        _RunResult_stdout.set(this, void 0);
        _RunResult_stderr.set(this, void 0);
        __classPrivateFieldSet(this, _RunResult_cmd, `${progname} ${args.map((a) => JSON.stringify(a))}`, "f");
        __classPrivateFieldSet(this, _RunResult_status, status, "f");
        __classPrivateFieldSet(this, _RunResult_stdout, stdout, "f");
        __classPrivateFieldSet(this, _RunResult_stderr, stderr, "f");
    }
    get cmd() { return __classPrivateFieldGet(this, _RunResult_cmd, "f"); }
    get stderr() {
        return this._stderr.toString() || null;
    }
    get _stderr() {
        return __classPrivateFieldGet(this, _RunResult_stderr, "f");
    }
    get stdout() {
        return this._stdout.toString();
    }
    get _stdout() {
        return __classPrivateFieldGet(this, _RunResult_stdout, "f");
    }
    get status() { return __classPrivateFieldGet(this, _RunResult_status, "f"); }
    get ok() {
        return (__classPrivateFieldGet(this, _RunResult_stderr, "f").length === 0 && __classPrivateFieldGet(this, _RunResult_status, "f") === 0);
    }
    assertOk(message) {
        if (!this.ok) {
            throw new Error(message || `failed to run: ${__classPrivateFieldGet(this, _RunResult_cmd, "f")}`);
        }
    }
}
exports.RunResult = RunResult;
_RunResult_cmd = new WeakMap(), _RunResult_status = new WeakMap(), _RunResult_stdout = new WeakMap(), _RunResult_stderr = new WeakMap();
;
function run(progname, args, currentWorkingDirectory) {
    if (args == null) {
        args = [];
    }
    const options = {};
    if (currentWorkingDirectory) {
        options.cwd = currentWorkingDirectory;
    }
    const child = (0, child_process_1.spawnSync)(progname, args, options);
    const result = new RunResult(progname, args, child.status, child.stdout, child.stderr);
    if (child.error) {
        const error = child.error;
        error.result = result;
        throw error;
    }
    return result;
}
exports.run = run;
//# sourceMappingURL=run.js.map
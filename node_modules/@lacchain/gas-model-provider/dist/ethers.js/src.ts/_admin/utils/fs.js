"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atomicWrite = void 0;
const fs_1 = __importDefault(require("fs"));
const path_js_1 = require("./path.js");
function atomicWrite(path, value) {
    const tmp = (0, path_js_1.resolve)(".atomic-tmp");
    fs_1.default.writeFileSync(tmp, value);
    fs_1.default.renameSync(tmp, path);
}
exports.atomicWrite = atomicWrite;
//# sourceMappingURL=fs.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = exports.ROOT = void 0;
const path_1 = require("path");
const url_1 = require("url");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = (0, path_1.dirname)(__filename);
exports.ROOT = (0, path_1.resolve)(__dirname, "../../../");
function resolve(...args) {
    args = args.slice();
    args.unshift(exports.ROOT);
    return path_1.resolve.apply(null, args);
}
exports.resolve = resolve;
//# sourceMappingURL=path.js.map
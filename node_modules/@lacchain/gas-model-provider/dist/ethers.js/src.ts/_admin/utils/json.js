"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveJson = exports.loadJson = void 0;
const fs_1 = __importDefault(require("fs"));
const fs_js_1 = require("./fs.js");
function loadJson(path) {
    return JSON.parse(fs_1.default.readFileSync(path).toString());
}
exports.loadJson = loadJson;
function saveJson(filename, data, sort) {
    let replacer = undefined;
    if (sort) {
        replacer = (key, value) => {
            if (Array.isArray(value)) {
                // pass
            }
            else if (value && typeof (value) === "object") {
                const keys = Object.keys(value);
                let sortFunc;
                if (typeof (sort) === "function") {
                    sortFunc = function (a, b) {
                        return sort(key, a, b);
                    };
                }
                keys.sort(sortFunc);
                return keys.reduce((accum, key) => {
                    accum[key] = value[key];
                    return accum;
                }, {});
            }
            return value;
        };
    }
    (0, fs_js_1.atomicWrite)(filename, JSON.stringify(data, replacer, 2) + "\n");
}
exports.saveJson = saveJson;
//# sourceMappingURL=json.js.map
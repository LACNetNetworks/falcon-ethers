"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChanges = void 0;
const fs_1 = __importDefault(require("fs"));
const path_js_1 = require("./path.js");
function getChanges() {
    const changes = [
        { title: "", version: "null", body: [] }
    ];
    const content = fs_1.default.readFileSync((0, path_js_1.resolve)("CHANGELOG.md")).toString();
    for (const line of content.split("\n")) {
        let match = line.match(/^ethers\/v(\S+)\s/);
        if (match) {
            changes.push({ version: match[1], title: line.trim(), body: [] });
        }
        else {
            const l = line.trim();
            if (l && !l.match(/^-+$/)) {
                changes[changes.length - 1].body.push(l);
            }
        }
    }
    changes.shift();
    return changes;
}
exports.getChanges = getChanges;
//# sourceMappingURL=changelog.js.map
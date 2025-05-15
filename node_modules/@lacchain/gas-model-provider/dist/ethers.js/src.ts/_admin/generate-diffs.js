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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const npm_js_1 = require("./utils/npm.js");
const path_js_1 = require("./utils/path.js");
const git_js_1 = require("./utils/git.js");
function escver(v) {
    return v.replace(/\./, "-");
}
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        let versions = yield (0, npm_js_1.getVersions)("ethers");
        versions = versions.filter((h) => (h.version.match(/^6\.[0-9]+\.[0-9]+$/)));
        fs_1.default.writeFileSync((0, path_js_1.resolve)("misc/diffs/versions.txt"), versions.map((h) => h.version).join(","));
        for (let i = 0; i < versions.length; i++) {
            for (let j = i + 1; j < versions.length; j++) {
                const filename = (0, path_js_1.resolve)(`misc/diffs/diff-${escver(versions[i].version)}_${escver(versions[j].version)}.txt`);
                if (fs_1.default.existsSync(filename)) {
                    continue;
                }
                const tag0 = versions[i].gitHead, tag1 = versions[j].gitHead;
                const diff = yield (0, git_js_1.getDiff)((0, path_js_1.resolve)("src.ts"), tag0, tag1);
                console.log({ diff });
                fs_1.default.writeFileSync(filename, diff);
            }
        }
    });
})();
//# sourceMappingURL=generate-diffs.js.map
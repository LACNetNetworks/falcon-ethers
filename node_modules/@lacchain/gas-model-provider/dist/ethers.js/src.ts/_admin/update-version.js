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
const semver_1 = __importDefault(require("semver"));
const index_js_1 = require("../utils/index.js");
const fs_js_1 = require("./utils/fs.js");
const git_js_1 = require("./utils/git.js");
const json_js_1 = require("./utils/json.js");
const path_js_1 = require("./utils/path.js");
const cache = {};
function getNpmPackage(name) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!cache[name]) {
            const resp = yield (new index_js_1.FetchRequest("https:/\/registry.npmjs.org/" + name)).send();
            resp.assertOk();
            cache[name] = resp.bodyJson;
        }
        return cache[name] || null;
    });
}
function writeVersion(version) {
    const content = `/* Do NOT modify this file; see /src.ts/_admin/update-version.ts */\n\n/**\n *  The current version of Ethers.\n */\nexport const version: string = "${version}";\n`;
    (0, fs_js_1.atomicWrite)((0, path_js_1.resolve)("src.ts/_version.ts"), content);
}
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        // Local pkg
        const pkgPath = (0, path_js_1.resolve)("package.json");
        const pkgInfo = (0, json_js_1.loadJson)(pkgPath);
        const tag = pkgInfo.publishConfig.tag;
        // Get the remote version that matches our dist-tag
        const remoteInfo = yield getNpmPackage(pkgInfo.name);
        const remoteVersion = remoteInfo["dist-tags"][tag];
        // Remote pkg
        const remotePkgInfo = remoteInfo.versions[remoteVersion];
        const remoteGitHead = remotePkgInfo.gitHead;
        let gitHead = "";
        for (const log of yield (0, git_js_1.getLogs)(["."])) {
            if (log.body.startsWith("admin:")) {
                continue;
            }
            if (log.body.startsWith("docs:")) {
                continue;
            }
            if (log.body.startsWith("tests:")) {
                continue;
            }
            gitHead = log.commit;
            break;
        }
        if (gitHead === "") {
            throw new Error("no meaningful commit found");
        }
        // There are new commits, not reflected in the package
        // published on npm; update the gitHead and version
        if (gitHead !== remoteGitHead) {
            // Bump the version from the remote version
            if (tag.indexOf("beta") >= 0) {
                // Still a beta branch; advance the beta version
                const prerelease = semver_1.default.prerelease(remoteVersion);
                if (prerelease == null || prerelease.length !== 2) {
                    throw new Error("no prerelease found");
                }
                pkgInfo.version = semver_1.default.inc(remoteVersion, "prerelease", String(prerelease[0]));
            }
            else if (semver_1.default.minor(remoteVersion) == semver_1.default.minor(pkgInfo.version)) {
                // If we want to bump the minor version, it was done explicitly in the pkg
                pkgInfo.version = semver_1.default.inc(remoteVersion, "patch");
            }
            pkgInfo.gitHead = gitHead;
            // Save the package.json
            const check = { "default": 1, "require": 1, "import": 1, "types": 1 };
            (0, json_js_1.saveJson)(pkgPath, pkgInfo, (path, a, b) => {
                if ((path.startsWith("./") || path === ".") && check[a] && check[b]) {
                    const cmp = a.localeCompare(b);
                    if (cmp === 0) {
                        return cmp;
                    }
                    // Make sure require comes first; it has the types built-in
                    // so its ok
                    if (a === "require") {
                        return -1;
                    }
                    if (b === "require") {
                        return 1;
                    }
                    // Favour types the next-first and default for last
                    if (a === "types" || b === "default") {
                        return -1;
                    }
                    if (b === "types" || a === "default") {
                        return 1;
                    }
                    return cmp;
                }
                return a.localeCompare(b);
            });
            // Save the src.ts/_version.ts
            writeVersion(pkgInfo.version);
        }
    });
})().catch((error) => {
    console.log("ERROR");
    console.log(error);
    process.exit(1);
});
//# sourceMappingURL=update-version.js.map
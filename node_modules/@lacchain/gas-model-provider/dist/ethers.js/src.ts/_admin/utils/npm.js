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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersions = exports._getNpmPackage = void 0;
const index_js_1 = require("../../utils/index.js");
const cache = {};
function _getNpmPackage(name) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!cache[name]) {
            const resp = yield (new index_js_1.FetchRequest("https:/\/registry.npmjs.org/" + name)).send();
            resp.assertOk();
            cache[name] = resp.bodyJson;
        }
        return cache[name] || null;
    });
}
exports._getNpmPackage = _getNpmPackage;
function getVersions(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = [];
        const pkg = yield _getNpmPackage(name);
        for (const version in pkg.versions) {
            const gitHead = pkg.versions[version].gitHead;
            const date = pkg.time[version];
            if (gitHead == null || date == null) {
                continue;
            }
            result.push({ date, gitHead, version });
        }
        return result;
    });
}
exports.getVersions = getVersions;
/*
(async function() {
    //console.log(await _getNpmPackage("ethers"));
    console.log(await getGitHeads("ethers"));
})();
*/
/*
import semver from "semver";

import { FetchRequest } from "../../utils/index.js";

export type PackageInfo = {
    dependencies: { [ name: string ]: string };
    devDependencies: { [ name: string ]: string };
    gitHead: string;
    name: string;
    version: string;
    tarballHash: string;
    location: "remote" | "local";
    _ethers_nobuild: boolean;
};

export class Package {
    readonly #info: PackageInfo;

    constructor(info: PackageInfo) {
        this.#info = info;
    }

    get name(): string { return this.#info.name; }
    get version(): string { return this.#info.version; }

    get dependencies(): Record<string, string> { return this.#info.dependencies; }
    get devDependencies(): Record<string, string> { return this.#info.devDependencies; }

    get gitHead(): string { return this.#info.gitHead; }
    get tarballHash(): string { return this.#info.tarballHash; }

}


const cache: Record<string, any> = { };

async function getPackageInfo(name: string): Promise<any> {
    if (!cache[name]) {
        const resp = await (new FetchRequest("https:/\/registry.npmjs.org/" + name)).send();
        resp.assertOk();
        cache[name] = resp.bodyJson();
    }

    return cache[name] || null;
}

export async function getPackage(name: string, version?: string): Promise<null | Package> {
    const infos = await getPackageInfo(name);
    if (infos == null) { return null; }

    if (version == null) {
        const versions = Object.keys(infos.versions);
        versions.sort(semver.compare);

        // HACK: So v5 continues working while v6 is managed by reticulate
        version = "6.0.0";
        while (version.indexOf("beta") >= 0 || semver.gte(version, "6.0.0")) {
            version = versions.pop();
        }
    }

    const info = infos.versions[version];

    return new Package({
        dependencies: (info.dependencies || {}),
        devDependencies: (info.devDependencies || {}),
        gitHead: info.gitHead,
        location: "remote",
        name: info.name,
        tarballHash: info.tarballHash,
        version : info.version,
        _ethers_nobuild: !!info._ethers_nobuild,
    });
}
*/
//# sourceMappingURL=npm.js.map
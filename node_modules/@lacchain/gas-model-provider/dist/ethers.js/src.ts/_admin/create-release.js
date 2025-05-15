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
const changelog_js_1 = require("./utils/changelog.js");
const date_js_1 = require("./utils/date.js");
const path_js_1 = require("./utils/path.js");
const run_js_1 = require("./utils/run.js");
const npm_js_1 = require("./utils/npm.js");
const version = process.argv[2] || null;
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        // Get the change from the CHANGELOG
        const changes = (0, changelog_js_1.getChanges)();
        const change = version ? changes.filter((c) => (c.version === version))[0] : changes.shift();
        if (change == null) {
            throw new Error(`version not found: ${version}`);
        }
        console.log(change);
        // Find the gitHead and release date
        const versions = yield (0, npm_js_1.getVersions)("ethers");
        const ver = versions.filter((c) => (c.version === change.version))[0];
        if (ver == null) {
            throw new Error(`no npm version found: ${change.version}`);
        }
        console.log(ver);
        const title = `${change.title.split("(")[0].trim()} (${(0, date_js_1.getDateTime)(new Date(ver.date))})`;
        const args = [
            "release", "create", `v${change.version}`,
            //        "--draft", // DEBUGGING
            "--title", title,
            "--target", ver.gitHead,
            "--notes", change.body.join("\n"),
        ];
        console.log(args);
        const result = yield (0, run_js_1.run)("gh", args, (0, path_js_1.resolve)("."));
        console.log("Published");
        console.log(`See: ${(result.stdout || "").trim()}`);
    });
})().catch((e) => {
    console.log("ERROR");
    console.log(e);
});
//# sourceMappingURL=create-release.js.map
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
exports.getTags = exports.getDiff = exports.getLogs = exports.getModifiedTime = exports.getGitTag = void 0;
const path_1 = require("path");
const url_1 = require("url");
const run_js_1 = require("./run.js");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = (0, path_1.dirname)(__filename);
// Returns the most recent git commit hash for a given filename
function getGitTag(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, run_js_1.run)("git", ["log", "-n", "1", "--", filename], __dirname);
        if (!result.ok) {
            throw new Error(`git log error`);
        }
        let log = result.stdout.trim();
        if (!log) {
            return null;
        }
        const hashMatch = log.match(/^commit\s+([0-9a-f]{40})\n/i);
        if (!hashMatch) {
            return null;
        }
        return hashMatch[1];
    });
}
exports.getGitTag = getGitTag;
function getModifiedTime(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, run_js_1.run)("git", ["log", "-n", "1", "--", filename], __dirname);
        if (!result.ok) {
            throw new Error(`git log error`);
        }
        let log = result.stdout.trim();
        if (!log) {
            return null;
        }
        for (let line of log.split("\n")) {
            line = line.trim();
            if (!line) {
                break;
            }
            const match = line.match(/^date:\s+(.*)$/i);
            if (match) {
                return (new Date(match[1].trim())).getTime();
                ;
            }
        }
        return null;
    });
}
exports.getModifiedTime = getModifiedTime;
function getLogs(files, range, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        const args = ["log", "-n", String((limit != null) ? limit : 100)];
        if (range) {
            args.push(`${range.tag0}..${range.tag1}`);
        }
        if (files) {
            args.push("--");
            files.forEach((f) => args.push(f));
        }
        const exec = yield (0, run_js_1.run)("git", args);
        if (!exec.ok) {
            throw new Error(`git log error`);
        }
        const log = exec.stdout.trim();
        if (!log) {
            return [];
        }
        const results = [{ commit: "", author: "", date: "", body: "" }];
        for (const line of log.split("\n")) {
            const hashMatch = line.match(/^commit\s+([0-9a-f]{40})/i);
            if (hashMatch) {
                results.push({ commit: hashMatch[1], author: "", date: "", body: "" });
            }
            else {
                if (line.startsWith("Author:")) {
                    results[results.length - 1].author = line.substring(7).trim();
                }
                else if (line.startsWith("Date:")) {
                    results[results.length - 1].date = line.substring(5).trim();
                }
                else {
                    results[results.length - 1].body = (results[results.length - 1].body + " " + line).trim();
                }
            }
        }
        // Nix the bootstrap entry
        results.shift();
        return results;
    });
}
exports.getLogs = getLogs;
function getDiff(filename, tag0, tag1) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, run_js_1.run)("git", ["diff", `${tag0}..${tag1}`, "--", filename]);
        if (!result.ok) {
            throw new Error(`git log error`);
        }
        return result.stdout.trim();
    });
}
exports.getDiff = getDiff;
function getTags() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, run_js_1.run)("git", ["tag"]);
        if (!result.ok) {
            throw new Error(`git log error`);
        }
        return result.stdout.trim().split("\n");
    });
}
exports.getTags = getTags;
//# sourceMappingURL=git.js.map
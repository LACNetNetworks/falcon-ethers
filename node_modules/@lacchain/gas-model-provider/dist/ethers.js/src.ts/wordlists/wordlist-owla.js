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
var _WordlistOwlA_accent;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordlistOwlA = void 0;
const wordlist_owl_js_1 = require("./wordlist-owl.js");
const decode_owla_js_1 = require("./decode-owla.js");
/**
 *  An OWL-A format Wordlist extends the OWL format to add an
 *  overlay onto an OWL format Wordlist to support diacritic
 *  marks.
 *
 *  This class is generally not useful to most developers as
 *  it is used mainly internally to keep Wordlists for languages
 *  based on latin-1 small.
 *
 *  If necessary, there are tools within the ``generation/`` folder
 *  to create the necessary data.
 */
class WordlistOwlA extends wordlist_owl_js_1.WordlistOwl {
    /**
     *  Creates a new Wordlist for %%locale%% using the OWLA %%data%%
     *  and %%accent%% data and validated against the %%checksum%%.
     */
    constructor(locale, data, accent, checksum) {
        super(locale, data, checksum);
        _WordlistOwlA_accent.set(this, void 0);
        __classPrivateFieldSet(this, _WordlistOwlA_accent, accent, "f");
    }
    /**
     *  The OWLA-encoded accent data.
     */
    get _accent() { return __classPrivateFieldGet(this, _WordlistOwlA_accent, "f"); }
    /**
     *  Decode all the words for the wordlist.
     */
    _decodeWords() {
        return (0, decode_owla_js_1.decodeOwlA)(this._data, this._accent);
    }
}
exports.WordlistOwlA = WordlistOwlA;
_WordlistOwlA_accent = new WeakMap();
//# sourceMappingURL=wordlist-owla.js.map
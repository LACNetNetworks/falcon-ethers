"use strict";
// Use the encode-latin.js script to create the necessary
// data files to be consumed by this class
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
var _WordlistOwl_instances, _WordlistOwl_data, _WordlistOwl_checksum, _WordlistOwl_words, _WordlistOwl_loadWords;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordlistOwl = void 0;
const index_js_1 = require("../hash/index.js");
const index_js_2 = require("../utils/index.js");
const decode_owl_js_1 = require("./decode-owl.js");
const wordlist_js_1 = require("./wordlist.js");
/**
 *  An OWL format Wordlist is an encoding method that exploits
 *  the general locality of alphabetically sorted words to
 *  achieve a simple but effective means of compression.
 *
 *  This class is generally not useful to most developers as
 *  it is used mainly internally to keep Wordlists for languages
 *  based on ASCII-7 small.
 *
 *  If necessary, there are tools within the ``generation/`` folder
 *  to create the necessary data.
 */
class WordlistOwl extends wordlist_js_1.Wordlist {
    /**
     *  Creates a new Wordlist for %%locale%% using the OWL %%data%%
     *  and validated against the %%checksum%%.
     */
    constructor(locale, data, checksum) {
        super(locale);
        _WordlistOwl_instances.add(this);
        _WordlistOwl_data.set(this, void 0);
        _WordlistOwl_checksum.set(this, void 0);
        _WordlistOwl_words.set(this, void 0);
        __classPrivateFieldSet(this, _WordlistOwl_data, data, "f");
        __classPrivateFieldSet(this, _WordlistOwl_checksum, checksum, "f");
        __classPrivateFieldSet(this, _WordlistOwl_words, null, "f");
    }
    /**
     *  The OWL-encoded data.
     */
    get _data() { return __classPrivateFieldGet(this, _WordlistOwl_data, "f"); }
    /**
     *  Decode all the words for the wordlist.
     */
    _decodeWords() {
        return (0, decode_owl_js_1.decodeOwl)(__classPrivateFieldGet(this, _WordlistOwl_data, "f"));
    }
    getWord(index) {
        const words = __classPrivateFieldGet(this, _WordlistOwl_instances, "m", _WordlistOwl_loadWords).call(this);
        (0, index_js_2.assertArgument)(index >= 0 && index < words.length, `invalid word index: ${index}`, "index", index);
        return words[index];
    }
    getWordIndex(word) {
        return __classPrivateFieldGet(this, _WordlistOwl_instances, "m", _WordlistOwl_loadWords).call(this).indexOf(word);
    }
}
exports.WordlistOwl = WordlistOwl;
_WordlistOwl_data = new WeakMap(), _WordlistOwl_checksum = new WeakMap(), _WordlistOwl_words = new WeakMap(), _WordlistOwl_instances = new WeakSet(), _WordlistOwl_loadWords = function _WordlistOwl_loadWords() {
    if (__classPrivateFieldGet(this, _WordlistOwl_words, "f") == null) {
        const words = this._decodeWords();
        // Verify the computed list matches the official list
        const checksum = (0, index_js_1.id)(words.join("\n") + "\n");
        /* c8 ignore start */
        if (checksum !== __classPrivateFieldGet(this, _WordlistOwl_checksum, "f")) {
            throw new Error(`BIP39 Wordlist for ${this.locale} FAILED`);
        }
        /* c8 ignore stop */
        __classPrivateFieldSet(this, _WordlistOwl_words, words, "f");
    }
    return __classPrivateFieldGet(this, _WordlistOwl_words, "f");
};
//# sourceMappingURL=wordlist-owl.js.map
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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _Wallet_fromAccount;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const index_js_1 = require("../crypto/index.js");
const index_js_2 = require("../utils/index.js");
const base_wallet_js_1 = require("./base-wallet.js");
const hdwallet_js_1 = require("./hdwallet.js");
const json_crowdsale_js_1 = require("./json-crowdsale.js");
const json_keystore_js_1 = require("./json-keystore.js");
const mnemonic_js_1 = require("./mnemonic.js");
function stall(duration) {
    return new Promise((resolve) => { setTimeout(() => { resolve(); }, duration); });
}
/**
 *  A **Wallet** manages a single private key which is used to sign
 *  transactions, messages and other common payloads.
 *
 *  This class is generally the main entry point for developers
 *  that wish to use a private key directly, as it can create
 *  instances from a large variety of common sources, including
 *  raw private key, [[link-bip-39]] mnemonics and encrypte JSON
 *  wallets.
 */
class Wallet extends base_wallet_js_1.BaseWallet {
    /**
     *  Create a new wallet for the private %%key%%, optionally connected
     *  to %%provider%%.
     */
    constructor(key, provider) {
        if (typeof (key) === "string" && !key.startsWith("0x")) {
            key = "0x" + key;
        }
        let signingKey = (typeof (key) === "string") ? new index_js_1.SigningKey(key) : key;
        super(signingKey, provider);
    }
    connect(provider) {
        return new Wallet(this.signingKey, provider);
    }
    /**
     *  Resolves to a [JSON Keystore Wallet](json-wallets) encrypted with
     *  %%password%%.
     *
     *  If %%progressCallback%% is specified, it will receive periodic
     *  updates as the encryption process progreses.
     */
    encrypt(password, progressCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = { address: this.address, privateKey: this.privateKey };
            return yield (0, json_keystore_js_1.encryptKeystoreJson)(account, password, { progressCallback });
        });
    }
    /**
     *  Returns a [JSON Keystore Wallet](json-wallets) encryped with
     *  %%password%%.
     *
     *  It is preferred to use the [async version](encrypt) instead,
     *  which allows a [[ProgressCallback]] to keep the user informed.
     *
     *  This method will block the event loop (freezing all UI) until
     *  it is complete, which may be a non-trivial duration.
     */
    encryptSync(password) {
        const account = { address: this.address, privateKey: this.privateKey };
        return (0, json_keystore_js_1.encryptKeystoreJsonSync)(account, password);
    }
    /**
     *  Creates (asynchronously) a **Wallet** by decrypting the %%json%%
     *  with %%password%%.
     *
     *  If %%progress%% is provided, it is called periodically during
     *  decryption so that any UI can be updated.
     */
    static fromEncryptedJson(json, password, progress) {
        return __awaiter(this, void 0, void 0, function* () {
            let account = null;
            if ((0, json_keystore_js_1.isKeystoreJson)(json)) {
                account = yield (0, json_keystore_js_1.decryptKeystoreJson)(json, password, progress);
            }
            else if ((0, json_crowdsale_js_1.isCrowdsaleJson)(json)) {
                if (progress) {
                    progress(0);
                    yield stall(0);
                }
                account = (0, json_crowdsale_js_1.decryptCrowdsaleJson)(json, password);
                if (progress) {
                    progress(1);
                    yield stall(0);
                }
            }
            return __classPrivateFieldGet(Wallet, _a, "m", _Wallet_fromAccount).call(Wallet, account);
        });
    }
    /**
     *  Creates a **Wallet** by decrypting the %%json%% with %%password%%.
     *
     *  The [[fromEncryptedJson]] method is preferred, as this method
     *  will lock up and freeze the UI during decryption, which may take
     *  some time.
     */
    static fromEncryptedJsonSync(json, password) {
        let account = null;
        if ((0, json_keystore_js_1.isKeystoreJson)(json)) {
            account = (0, json_keystore_js_1.decryptKeystoreJsonSync)(json, password);
        }
        else if ((0, json_crowdsale_js_1.isCrowdsaleJson)(json)) {
            account = (0, json_crowdsale_js_1.decryptCrowdsaleJson)(json, password);
        }
        else {
            (0, index_js_2.assertArgument)(false, "invalid JSON wallet", "json", "[ REDACTED ]");
        }
        return __classPrivateFieldGet(Wallet, _a, "m", _Wallet_fromAccount).call(Wallet, account);
    }
    /**
     *  Creates a new random [[HDNodeWallet]] using the available
     *  [cryptographic random source](randomBytes).
     *
     *  If there is no crytographic random source, this will throw.
     */
    static createRandom(provider) {
        const wallet = hdwallet_js_1.HDNodeWallet.createRandom();
        if (provider) {
            return wallet.connect(provider);
        }
        return wallet;
    }
    /**
     *  Creates a [[HDNodeWallet]] for %%phrase%%.
     */
    static fromPhrase(phrase, provider) {
        const wallet = hdwallet_js_1.HDNodeWallet.fromPhrase(phrase);
        if (provider) {
            return wallet.connect(provider);
        }
        return wallet;
    }
}
exports.Wallet = Wallet;
_a = Wallet, _Wallet_fromAccount = function _Wallet_fromAccount(account) {
    (0, index_js_2.assertArgument)(account, "invalid JSON wallet", "json", "[ REDACTED ]");
    if ("mnemonic" in account && account.mnemonic && account.mnemonic.locale === "en") {
        const mnemonic = mnemonic_js_1.Mnemonic.fromEntropy(account.mnemonic.entropy);
        const wallet = hdwallet_js_1.HDNodeWallet.fromMnemonic(mnemonic, account.mnemonic.path);
        if (wallet.address === account.address && wallet.privateKey === account.privateKey) {
            return wallet;
        }
        console.log("WARNING: JSON mismatch address/privateKey != mnemonic; fallback onto private key");
    }
    const wallet = new Wallet(account.privateKey);
    (0, index_js_2.assertArgument)(wallet.address === account.address, "address/privateKey mismatch", "json", "[ REDACTED ]");
    return wallet;
};
//# sourceMappingURL=wallet.js.map
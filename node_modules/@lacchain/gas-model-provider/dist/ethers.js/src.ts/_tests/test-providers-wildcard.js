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
const assert_1 = __importDefault(require("assert"));
const create_provider_js_1 = require("./create-provider.js");
(0, create_provider_js_1.setupProviders)();
describe("Test EIP-2544 ENS wildcards", function () {
    const provider = (0, create_provider_js_1.connect)("goerli");
    it("Resolves recursively", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const resolver = yield provider.getResolver("ricmoose.hatch.eth");
            assert_1.default.ok(resolver, "failed to get resolver");
            assert_1.default.equal(resolver.address, "0x15abA1fa74Bfdecd63A71218DC632d4328Db8168", "address");
            assert_1.default.equal(yield resolver.supportsWildcard(), true, "supportsWildcard()");
            // Test pass-through avatar
            assert_1.default.equal(yield resolver.getAvatar(), "https:/\/static.ricmoo.com/uploads/profile-06cb9c3031c9.jpg", "getAvatar()");
            assert_1.default.equal(yield resolver.getAddress(), "0x4B711A377B1b3534749FBe5e59Bcf7F94d92EA98", "getAddress()");
        });
    });
});
//# sourceMappingURL=test-providers-wildcard.js.map
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
const Livechat_1 = __importDefault(require("../../lib/api/Livechat"));
const log_1 = require("../../lib/log");
const config_1 = require("../config");
log_1.silence();
const { token } = config_1.mockVisitor.visitor;
const livechat = new Livechat_1.default(({}));
function config() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`

		Get default Livechat Config \`livechat.config()\`:
		${JSON.stringify(yield livechat.config(), null, '\t')}

		Get Livechat Config with Token \`livechat.config({ token })\`:
		${JSON.stringify(yield livechat.config({ token }), null, '\t')}

	`);
    });
}
config().catch((e) => console.error(e));
//# sourceMappingURL=config.js.map
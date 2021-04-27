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
const livechat = new Livechat_1.default({});
function visitors() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`

Demo of API livechat query helpers

Create Livechat Visitor \`livechat.grantVisitor()\`:
${JSON.stringify(yield livechat.grantVisitor(config_1.mockVisitor), null, '\t')}

Add new Livechat CustomField \`livechat.sendCustomField()\`:
${JSON.stringify(yield livechat.sendCustomField(config_1.mockCustomField), null, '\t')}

Add new Livechat CustomFields \`livechat.sendCustomFields()\`:
${JSON.stringify(yield livechat.sendCustomFields(config_1.mockCustomFields), null, '\t')}

\`livechat.visitor()\`:
${JSON.stringify(yield livechat.visitor(), null, '\t')}

	`);
    });
}
visitors().catch((e) => console.error(e));
//# sourceMappingURL=visitors.js.map
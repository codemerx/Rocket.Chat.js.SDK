"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const settings = __importStar(require("../../lib/settings"));
const log_1 = require("../../lib/log");
const config_1 = require("../config");
log_1.silence();
const livechat = new Livechat_1.default({});
function getVisitorToken() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\nPreparing visitor token for tests...');
        let token = settings.token;
        if (!token || token === '') {
            const { visitor } = yield livechat.grantVisitor(config_1.mockVisitor);
            token = visitor && visitor.token;
        }
        return token;
    });
}
function getRoom(token) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\nPreparing room for tests...');
        const { room } = yield livechat.room();
        return room;
    });
}
function messages() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getVisitorToken();
        const room = yield getRoom(token);
        const rid = room && room._id;
        const newMessage = { token, rid, msg: 'sending livechat message..' };
        const editMessage = { token, rid, msg: 'editing livechat message..' };
        const result = yield livechat.sendMessage(newMessage);
        const _id = result && result.message && result.message._id;
        const pageInfo = Object.assign({}, config_1.mockVisitorNavigation, { rid });
        console.log(`

Demo of API livechat query helpers

Send Livechat Message \`livechat.sendMessage()\`:
${JSON.stringify(result, null, '\t')}

Edit Livechat Message \`livechat.editMessage()\`:
${JSON.stringify(yield livechat.editMessage(_id, editMessage), null, '\t')}

Load Livechat Messages \`livechat.loadMessages()\`:
${JSON.stringify(yield livechat.loadMessages(rid, { token }), null, '\t')}

Delete Livechat Message \`livechat.deleteMessage()\`:
${JSON.stringify(yield livechat.deleteMessage(_id, { rid }), null, '\t')}

Send Livechat Offline Message \`livechat.sendOfflineMessage()\`:
${JSON.stringify(yield livechat.sendOfflineMessage(config_1.mockOfflineMessage), null, '\t')}

Send Livechat Visitor Navigation \`livechat.sendVisitorNavigation()\`:
${JSON.stringify(yield livechat.sendVisitorNavigation(pageInfo), null, '\t')}

  `);
    });
}
messages().catch((e) => console.error(e));
//# sourceMappingURL=messages.js.map
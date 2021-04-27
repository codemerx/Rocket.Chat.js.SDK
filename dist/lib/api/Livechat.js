"use strict";
/**
 * @module ApiLivechat
 * Provides a client for making requests with Livechat Rocket.Chat's REST API
 */
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
const api_1 = __importDefault(require("./api"));
class ApiLivechat extends api_1.default {
    constructor() {
        super(...arguments);
        this.credentials = {};
    }
    login(guest) { return this.grantVisitor(guest); }
    config(params) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.get('livechat/config', params, false)).config; });
    }
    room(params) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.get('livechat/room', Object.assign({ token: this.credentials.token }, params), false)).room; });
    }
    closeChat({ rid }) { return this.post('livechat/room.close', { rid, token: this.credentials.token }, false); }
    transferChat({ rid, department }) { return (this.post('livechat/room.transfer', { rid, token: this.credentials.token, department }, false)); }
    chatSurvey(survey) { return (this.post('livechat/room.survey', { rid: survey.rid, token: this.credentials.token, data: survey.data }, false)); }
    visitor() { return this.get(`livechat/visitor/${this.credentials.token}`); }
    grantVisitor(guest) {
        return __awaiter(this, void 0, void 0, function* () {
            const { visitor } = yield this.post('livechat/visitor', guest, false);
            this.credentials = {
                token: visitor.token
            };
            return visitor;
        });
    }
    deleteVisitor() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.del(`livechat/visitor/${this.credentials.token}`)).visitor; });
    }
    updateVisitorStatus(status) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.post(`livechat/visitor.status`, { token: this.credentials.token, status })).status; });
    }
    nextAgent(department = '') {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.get(`livechat/agent.next/${this.credentials.token}`, { department })).agent; });
    }
    agent({ rid }) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.get(`livechat/agent.info/${rid}/${this.credentials.token}`)).agent; });
    }
    message(id, params) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.get(`livechat/message/${id}`, Object.assign({ token: this.credentials.token }, params))).message; });
    }
    sendMessage(message) { return (this.post('livechat/message', Object.assign(Object.assign({}, message), { token: this.credentials.token }), false)); }
    editMessage(id, message) { return (this.put(`livechat/message/${id}`, message, false)); }
    deleteMessage(id, { rid }) { return (this.del(`livechat/message/${id}`, { rid, token: this.credentials.token }, false)); }
    loadMessages(rid, params) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.get(`livechat/messages.history/${rid}`, Object.assign(Object.assign({}, params), { token: this.credentials.token }), false)).messages; });
    }
    sendOfflineMessage(message) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.post('livechat/offline.message', Object.assign({}, message), false)).message; });
    }
    sendVisitorNavigation(page) { return (this.post('livechat/page.visited', Object.assign({}, page), false)); }
    requestTranscript(email, { rid }) { return (this.post('livechat/transcript', { token: this.credentials.token, rid, email }, false)); }
    videoCall({ rid }) { return this.get(`livechat/video.call/${this.credentials.token}`, { rid }, false); }
    sendCustomField(field) { return this.post('livechat/custom.field', field, false); }
    sendCustomFields(fields) { return this.post('livechat/custom.fields', fields, false); }
    uploadFile(params) {
        const formData = new FormData();
        const headersNeededForUpload = {
            'x-visitor-token': this.credentials.token
        };
        formData.append('file', params.file);
        return this.post(`livechat/upload/${params.rid}`, formData, false, undefined, { customHeaders: headersNeededForUpload });
    }
}
exports.default = ApiLivechat;
//# sourceMappingURL=Livechat.js.map
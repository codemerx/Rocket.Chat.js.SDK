"use strict";
/**
    * @module ApiRocketChat
    * Provides a client for handling requests with Rocket.Chat's REST API
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
exports.userFields = void 0;
const api_1 = __importDefault(require("./api"));
/** Defaults for user queries */
exports.userFields = { name: 1, username: 1, status: 1, type: 1 };
/** Query helpers for user collection requests */
class ApiRocketChat extends api_1.default {
    get users() {
        const self = this;
        return {
            all(fields = exports.userFields) { return self.get('users.list', { fields }).then((r) => r.users); },
            allNames() { return self.get('users.list', { fields: { 'username': 1 } }).then((r) => r.users.map((u) => u.username)); },
            allIDs() { return self.get('users.list', { fields: { '_id': 1 } }).then((r) => r.users.map((u) => u._id)); },
            online(fields = exports.userFields) { return self.get('users.list', { fields, query: { 'status': { $ne: 'offline' } } }).then((r) => r.users); },
            onlineNames() { return self.get('users.list', { fields: { 'username': 1 }, query: { 'status': { $ne: 'offline' } } }).then((r) => r.users.map((u) => u.username)); },
            onlineIds() { return self.get('users.list', { fields: { '_id': 1 }, query: { 'status': { $ne: 'offline' } } }).then((r) => r.users.map((u) => u._id)); },
            info(username) {
                return __awaiter(this, void 0, void 0, function* () { return (yield self.get('users.info', { username }, true)).user; });
            }
        };
    }
    get rooms() {
        const self = this;
        return {
            info({ rid }) { return self.get('rooms.info', { rid }, true); }
        };
    }
    // editMessage(message: IMessage) chat.update
    joinRoom({ rid }) { return this.post('channels.join', { roomId: rid }, true); }
    info() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.get('info', {}, true)).info; });
    }
    /**
     * Send a prepared message object (with pre-defined room ID).
     * Usually prepared and called by sendMessageByRoomId or sendMessageByRoom.
     */
    sendMessage(message, rid) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.post('chat.sendMessage', { message: this.prepareMessage(message, rid) }, true)).message; });
    }
    getRoomIdByNameOrId(name) { return this.get('chat.getRoomIdByNameOrId', { name }, true); }
    getRoomNameById(rid) { return this.getRoomName(rid); }
    getRoomName(rid) {
        return __awaiter(this, void 0, void 0, function* () {
            const room = yield this.get('chat.getRoomNameById', { rid }, true);
            return room.name;
        });
    }
    getRoomId(name) { return this.get('chat.find', { name }, true); }
    createDirectMessage(username) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.post('im.create', { username }, true)).room; });
    }
    /**
     * Edit an existing message, replacing any attributes with those provided.
     * The given message object should have the ID of an existing message.
     */
    editMessage(message) {
        return this.post('chat.update', { roomId: message.rid, msgId: message._id, text: message.msg });
    }
    /**
     * Send a reaction to an existing message. Simple proxy for method call.
     * @param emoji     Accepts string like `:thumbsup:` to add 👍 reaction
     * @param messageId ID for a previously sent message
     */
    setReaction(emoji, messageId) { return this.post('chat.react', { emoji, messageId }, true); }
    // TODO fix this methods
    loadHistory(rid, lastUpdate) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.get('chat.syncMessages', { roomId: rid, lastUpdate: lastUpdate.toISOString() }, true)).result;
        });
    }
    /** Exit a room the bot has joined */
    leaveRoom(rid) {
        return this.post('rooms.leave', { rid }).then(() => rid);
    }
    /** Get information about a public group */
    channelInfo(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.get('channels.info', query, true)).channel;
        });
    }
    /** Get information about a private group */
    privateInfo(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.get('groups.info', query, true)).group;
        });
    }
}
exports.default = ApiRocketChat;
//# sourceMappingURL=RocketChat.js.map
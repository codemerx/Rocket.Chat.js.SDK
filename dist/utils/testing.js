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
exports.setup = exports.setupDirectFromUser = exports.updateFromUser = exports.inviteUser = exports.leaveUser = exports.sendFromUser = exports.createPrivate = exports.createChannel = exports.lastMessages = exports.privateInfo = exports.channelInfo = exports.createUser = exports.userInfo = exports.testPrivateName = exports.testChannelName = void 0;
const api_1 = __importDefault(require("../lib/api/api"));
const config_1 = require("./config");
const api = new api_1.default({});
/** Define common attributes for DRY tests */
exports.testChannelName = 'tests';
exports.testPrivateName = 'p-tests';
/** Get information about a user */
function userInfo(username) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield api.get('users.info', { username }, true);
    });
}
exports.userInfo = userInfo;
/** Create a user and catch the error if they exist already */
function createUser(user) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield api.post('users.create', user, true, /already in use/i));
    });
}
exports.createUser = createUser;
/** Get information about a channel */
function channelInfo(query) {
    return __awaiter(this, void 0, void 0, function* () {
        return api.get('channels.info', query, true);
    });
}
exports.channelInfo = channelInfo;
/** Get information about a private group */
function privateInfo(query) {
    return __awaiter(this, void 0, void 0, function* () {
        return api.get('groups.info', query, true);
    });
}
exports.privateInfo = privateInfo;
/** Get the last messages sent to a channel (in last 10 minutes) */
function lastMessages(roomId, count = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const latest = now.toISOString();
        const oldest = new Date(now.setMinutes(now.getMinutes() - 10)).toISOString();
        const history = yield api.get('channels.history', { roomId, latest, oldest, count });
        return history.messages;
    });
}
exports.lastMessages = lastMessages;
/** Create a room for tests and catch the error if it exists already */
function createChannel(name, members = [], readOnly = false) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield api.post('channels.create', { name, members, readOnly }, true);
    });
}
exports.createChannel = createChannel;
/** Create a private group / room and catch if exists already */
function createPrivate(name, members = [], readOnly = false) {
    return __awaiter(this, void 0, void 0, function* () {
        return (api.post('groups.create', { name, members, readOnly }, true));
    });
}
exports.createPrivate = createPrivate;
/** Send message from mock user to channel for tests to listen and respond */
/** @todo Sometimes the post request completes before the change event emits
 *        the message to the streamer. That's why the interval is used for proof
 *        of receipt. It would be better for the endpoint to not resolve until
 *        server side handling is complete. Would require PR to core.
 */
function sendFromUser(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield api.login({ username: config_1.mockUser.username, password: config_1.mockUser.password });
        const endpoint = (payload.roomId && payload.roomId.indexOf(user.userId) !== -1)
            ? 'dm.history'
            : 'channels.history';
        const roomId = (payload.roomId)
            ? payload.roomId
            : (yield channelInfo({ roomName: exports.testChannelName })).channel._id;
        const messageDefaults = { roomId };
        const data = Object.assign({}, messageDefaults, payload);
        const oldest = new Date().toISOString();
        const result = yield api.post('chat.postMessage', data, true);
        const proof = new Promise((resolve, reject) => {
            let looked = 0;
            const look = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                const { messages } = yield api.get(endpoint, { roomId, oldest });
                const found = messages.some((message) => {
                    return result.message._id === message._id;
                });
                if (found || looked > 10) {
                    clearInterval(look);
                    if (found)
                        resolve();
                    else
                        reject('API send from user, proof of receipt timeout');
                }
                looked++;
            }), 100);
        });
        yield proof;
        return result;
    });
}
exports.sendFromUser = sendFromUser;
/** Leave user from room, to generate `ul` message (test channel by default) */
function leaveUser(room = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        yield api.login({ username: config_1.mockUser.username, password: config_1.mockUser.password });
        if (!room.id && !room.name)
            room.name = exports.testChannelName;
        const roomId = (room.id)
            ? room.id
            : (yield channelInfo({ roomName: room.name })).channel._id;
        return yield api.post('channels.leave', { roomId });
    });
}
exports.leaveUser = leaveUser;
/** Invite user to room, to generate `au` message (test channel by default) */
function inviteUser(room = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        let mockInfo = yield userInfo(config_1.mockUser.username);
        yield api.login({ username: config_1.apiUser.username, password: config_1.apiUser.password });
        if (!room.id && !room.name)
            room.name = exports.testChannelName;
        const roomId = (room.id)
            ? room.id
            : (yield channelInfo({ roomName: room.name })).channel._id;
        return yield api.post('channels.invite', { userId: mockInfo._id, roomId });
    });
}
exports.inviteUser = inviteUser;
/** @todo : Join user into room (enter) to generate `uj` message type. */
/** Update message sent from mock user */
function updateFromUser(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        yield api.login({ username: config_1.mockUser.username, password: config_1.mockUser.password });
        return yield api.post('chat.update', payload, true);
    });
}
exports.updateFromUser = updateFromUser;
/** Create a direct message session with the mock user */
function setupDirectFromUser() {
    return __awaiter(this, void 0, void 0, function* () {
        yield api.login({ username: config_1.mockUser.username, password: config_1.mockUser.password });
        return yield api.post('im.create', { username: config_1.botUser.username }, true);
    });
}
exports.setupDirectFromUser = setupDirectFromUser;
/** Initialise testing instance with the required users for SDK/bot tests */
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\nPreparing instance for tests...');
        try {
            // Verify API user can login
            yield api.login({ password: config_1.apiUser.password, username: config_1.apiUser.username });
            console.log(`API user (${config_1.apiUser.username}) logged in`);
        }
        catch (error) {
            console.log(error, config_1.apiUser);
            throw new Error(`API user (${config_1.apiUser.username}) could not login`);
        }
        try {
            const botInfo = yield userInfo(config_1.botUser.username);
            console.log(`API user (${botInfo.username}) exists`);
        }
        catch (error) {
            console.log(`Bot user (${config_1.botUser.username}) not found`);
            const botInfo = yield createUser(config_1.botUser);
            // if (!botInfo.success) {
            //   throw new Error(`Bot user (${botUser.username}) could not be created`)
            // }
            console.log(`Bot user (${botInfo.username}) created`);
        }
        try {
            // Verify or create mock user for talking to bot
            let mockInfo = yield userInfo(config_1.mockUser.username);
            console.log(`Mock user (${mockInfo.username}) exists`);
        }
        catch (error) {
            console.log(`Mock user (${config_1.mockUser.username}) not found`);
            const mockInfo = yield createUser(config_1.mockUser);
            // if (!mockInfo || mockInfo.success) {
            //   throw new Error(`Mock user (${mockUser.username}) could not be created`)
            // }
            console.log(`Mock user (${mockInfo.username}) created`);
        }
        try {
            // Verify or create user for bot
            // Verify or create channel for tests
            yield channelInfo({ roomName: exports.testChannelName });
            console.log(`Test channel (${exports.testChannelName}) exists`);
        }
        catch (e) {
            console.log(`Test channel (${exports.testChannelName}) not found`);
            yield createChannel(exports.testChannelName, [
                config_1.apiUser.username, config_1.botUser.username, config_1.mockUser.username
            ]);
            // if (!testChannelInfo.success) {
            //   throw new Error(`Test channel (${testChannelName}) could not be created`)
            // }
            console.log(`Test channel (${exports.testChannelName}) created`);
        }
        try {
            // Verify or create private room for tests
            yield privateInfo({ roomName: exports.testPrivateName });
            console.log(`Test private room (${exports.testPrivateName}) exists`);
        }
        catch (error) {
            const testPrivateInfo = yield createPrivate(exports.testPrivateName, [
                config_1.apiUser.username, config_1.botUser.username, config_1.mockUser.username
            ]);
            console.log(`Test private room (${testPrivateInfo.name}) created`);
        }
        yield api.logout();
    });
}
exports.setup = setup;
//# sourceMappingURL=testing.js.map
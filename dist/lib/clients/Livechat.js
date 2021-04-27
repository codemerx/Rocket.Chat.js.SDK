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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
    * @module LivechatDriver
    * Provides high-level helpers for Livechat connection, method calls, subscriptions.
    */
const Livechat_1 = __importDefault(require("../api/Livechat"));
const drivers_1 = require("../drivers");
const log_1 = require("../log");
// @ts-ignore
class LivechatClient extends Livechat_1.default {
    constructor(_a) {
        var { logger, allPublic, rooms, integrationId, protocol = drivers_1.Protocols.DDP } = _a, config = __rest(_a, ["logger", "allPublic", "rooms", "integrationId", "protocol"]);
        super(Object.assign({ logger }, config));
        this.livechatStream = 'stream-livechat-room';
        this.userId = '';
        this.logger = log_1.logger;
        this.socket = Promise.resolve();
        this.import(protocol, config);
    }
    import(protocol, config) {
        switch (protocol) {
            // case Protocols.MQTT:
            //   this.socket = import(/* webpackChunkName: 'mqtttest' */ '../drivers/mqtt').then(({ MQTTDriver }) => new MQTTDriver({ logger: this.logger, ...config }))
            //   break
            case drivers_1.Protocols.DDP:
                this.socket = Promise.resolve().then(() => __importStar(require(/* webpackChunkName: 'ddptest' */ '../drivers/ddp'))).then(({ DDPDriver }) => new DDPDriver(Object.assign({ logger: this.logger }, config)));
                break;
            default:
                throw new Error(`Invalid Protocol: ${protocol}, valids: ${Object.keys(drivers_1.Protocols).join()}`);
        }
    }
    connect(options, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.socket).connect(options).then(() => (this.setUpConnection()));
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).disconnect(); });
    }
    unsubscribe(subscription) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).unsubscribe(subscription); });
    }
    unsubscribeAll() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).unsubscribeAll(); });
    }
    subscribeNotifyAll() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).subscribeNotifyAll(); });
    }
    subscribeLoggedNotify() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).subscribeLoggedNotify(); });
    }
    subscribeNotifyUser() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).subscribeNotifyUser(); });
    }
    onMessage(cb) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).onMessage(cb); });
    }
    onTyping(cb) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).onTyping(cb); });
    }
    onAgentChange(rid, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.subscribe(this.livechatStream, rid);
            yield this.onStreamData(this.livechatStream, ({ fields: { args: [{ type, data }] } }) => {
                if (type === 'agentData') {
                    cb(data);
                }
            });
        });
    }
    onAgentStatusChange(rid, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.subscribe(this.livechatStream, rid);
            yield this.onStreamData(this.livechatStream, ({ fields: { args: [{ type, status }] } }) => {
                if (type === 'agentStatus') {
                    cb(status);
                }
            });
        });
    }
    onQueuePositionChange(rid, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.subscribe(this.livechatStream, rid);
            yield this.onStreamData(this.livechatStream, ({ fields: { args: [{ type, data }] } }) => {
                if (type === 'queueData') {
                    cb(data);
                }
            });
        });
    }
    notifyVisitorTyping(rid, username, typing) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.socket).notifyVisitorTyping(rid, username, typing, this.credentials.token);
        });
    }
    subscribe(topic, eventName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = this.credentials;
            return (yield this.socket).subscribe(topic, eventName, { token, visitorToken: token });
        });
    }
    subscribeRoom(rid) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = this.credentials;
            return (yield this.socket).subscribeRoom(rid, { token, visitorToken: token });
        });
    }
    onStreamData(event, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.socket).onStreamData(event, cb);
        });
    }
    setUpConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = this.credentials;
            return (yield this.socket).methodCall('livechat:setUpConnection', { token });
        });
    }
}
exports.default = LivechatClient;
//# sourceMappingURL=Livechat.js.map
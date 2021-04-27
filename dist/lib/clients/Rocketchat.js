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
const drivers_1 = require("../drivers");
const RocketChat_1 = __importDefault(require("../api/RocketChat"));
const log_1 = require("../log");
class RocketChatClient extends RocketChat_1.default {
    constructor(_a) {
        var { logger, allPublic, rooms, integrationId, protocol = drivers_1.Protocols.DDP } = _a, config = __rest(_a, ["logger", "allPublic", "rooms", "integrationId", "protocol"]);
        super(Object.assign(Object.assign({}, config), { logger }));
        this.userId = '';
        this.logger = log_1.logger;
        this.logger = logger;
        switch (protocol) {
            // case Protocols.MQTT:
            //   this.socket = import(/* webpackChunkName: 'mqtt' */ '../drivers/mqtt').then(({ MQTTDriver }) => new MQTTDriver({ ...config, logger }))
            //   break
            case drivers_1.Protocols.DDP:
                this.socket = Promise.resolve().then(() => __importStar(require(/* webpackChunkName: 'ddp' */ '../drivers/ddp'))).then(({ DDPDriver }) => new DDPDriver(Object.assign(Object.assign({}, config), { logger })));
                break;
            default:
                throw new Error(`Invalid Protocol: ${protocol}, valids: ${Object.keys(drivers_1.Protocols).join()}`);
        }
    }
    resume({ token }) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.socket).login({ token }, {});
        });
    }
    login(credentials) {
        const _super = Object.create(null, {
            login: { get: () => super.login }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.login.call(this, credentials);
            return this.currentLogin && this.resume({ token: this.currentLogin.authToken });
        });
    }
    connect(options) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).connect(options); });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).disconnect(); });
    }
    checkAndReopen() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).checkAndReopen(); });
    }
    onStreamData(event, cb) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).onStreamData(event, cb); });
    }
    subscribe(topic, ...args) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).subscribe(topic, ...args); });
    }
    unsubscribe(subscription) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).unsubscribe(subscription); });
    }
    unsubscribeAll() {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).unsubscribeAll(); });
    }
    subscribeRoom(rid, ...args) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).subscribeRoom(rid, ...args); });
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
    get url() {
        return this.socket.then((socket) => socket.config.host);
    }
    onMessage(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.socket).onMessage(cb);
        });
    }
    methodCall(method, ...args) {
        return __awaiter(this, void 0, void 0, function* () { return (yield this.socket).methodCall(method, ...args); });
    }
}
exports.default = RocketChatClient;
//# sourceMappingURL=Rocketchat.js.map
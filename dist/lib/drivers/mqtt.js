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
exports.MQTTDriver = void 0;
const paho_mqtt_1 = require("paho-mqtt/src/paho-mqtt");
const tiny_events_1 = require("tiny-events");
const log_1 = require("../log");
const msgpack_lite_1 = __importDefault(require("msgpack-lite"));
// @ts-ignore
class MQTTDriver extends tiny_events_1.EventEmitter {
    constructor(_a) {
        var { host = 'localhost', path = '/', integrationId, config, logger = log_1.logger } = _a, moreConfigs = __rest(_a, ["host", "path", "integrationId", "config", "logger"]);
        super();
        this.methodCall = (method, ...args) => {
            return Promise.resolve();
        };
        host = 'localhost';
        const [, _host = host, , port = 8081] = new RegExp('(.*?)(:([0-9]+))?$').exec(host || 'localhost:3000') || [];
        this.config = Object.assign(Object.assign(Object.assign({}, config), moreConfigs), { host: _host.replace(/^http/, 'ws'), timeout: 20000, port: port });
        this.logger = logger;
        if (/https/.test(host)) {
            this.socket = new paho_mqtt_1.Client(this.config.host + path, 'clientId');
        }
        else {
            this.socket = new paho_mqtt_1.Client((this.config.host || '').replace('http://', '').replace('ws://', ''), Number(port), path, 'clientId');
        }
        this.socket.onMessageArrived = ({ destinationName, payloadBytes }) => {
            if (/room-message/.test(destinationName)) {
                this.emit('message', { topic: destinationName, message: msgpack_lite_1.default.decode(payloadBytes) });
            }
        };
    }
    connect(options) {
        return new Promise((resolve, reject) => {
            this.socket.connect({ userName: 'livechat-guest', password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2Ijp7InZpc2l0b3JUb2tlbiI6ImFqamVvY2N5dXhweXVlOTg3YzJ0NnMifSwidXNlciI6eyJ2Ijp7InZpc2l0b3JUb2tlbiI6ImFqamVvY2N5dXhweXVlOTg3YzJ0NnMifX0sIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.RTQz72NTgI6qWgQMCNHHaSNS13sDK3cz--ss2_5vAz8', onSuccess: resolve, onFailure: reject, useSSL: /https/.test(this.config.host || '') });
        });
    }
    disconnect() {
        this.socket.end();
        return Promise.resolve(this.socket);
    }
    subscribe(topic, { qos = 0 }) {
        return new Promise((resolve, reject) => {
            this.socket.subscribe(topic, { qos, onFailure: (...args) => {
                    console.log(...args);
                    reject(args);
                }, onSuccess: (...args) => {
                    console.log(...args);
                    resolve(args);
                }
            });
        });
    }
    unsubscribe(subscription, ...args) {
        return new Promise((resolve, reject) => {
            this.socket.unsubscribe(subscription.name, [...args, (err, granted) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(granted);
                }]);
        });
    }
    unsubscribeAll() {
        return Promise.resolve();
    }
    subscribeNotifyAll() {
        return Promise.resolve();
    }
    subscribeLoggedNotify() {
        return Promise.resolve();
    }
    subscribeNotifyUser() {
        return Promise.resolve();
    }
    login(credentials, args) {
        return Promise.resolve();
    }
    // usertyping room-messages deleted messages
    subscribeRoom(rid, ...args) {
        return this.subscribe(`room-messages/${rid}`, { qos: 0 });
    }
    onMessage(cb) {
        this.on('message', ({ topic, message }) => {
            if (/room-messages/.test(topic)) {
                cb(message); // TODO apply msgpack
            }
        });
    }
    onTyping(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                resolve(this.on('notify-room', ({ fields: { args: [username, isTyping] } }) => {
                    cb(username, isTyping);
                }));
            });
        });
    }
    notifyVisitorTyping(rid, username, typing, token) {
        return Promise.resolve();
    }
    onStreamData(name, cb) {
        return Promise.resolve(this.on(name, ({ fields: { args: [message] } }) => cb((message))));
    }
}
exports.MQTTDriver = MQTTDriver;
//# sourceMappingURL=mqtt.js.map
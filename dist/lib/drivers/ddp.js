"use strict";
/**
 * @module DDPDriver
 * Handles low-level websocket ddp connections and event subscriptions
 */
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
exports.DDPDriver = exports.Socket = void 0;
const universal_websocket_client_1 = __importDefault(require("universal-websocket-client"));
const tiny_events_1 = require("tiny-events");
const log_1 = require("../log");
const settings = __importStar(require("../settings"));
tiny_events_1.EventEmitter.prototype.removeAllListeners = function (event) {
    if (event) {
        this._listeners[event] = [];
    }
    else {
        this._listeners = {};
    }
    return [];
};
const interfaces_1 = require("../../interfaces");
const util_1 = require("../util");
const js_sha256_1 = require("js-sha256");
const userDisconnectCloseCode = 4000;
const reopenCloseCode = 4001;
/** Websocket handler class, manages connections and subscriptions by DDP */
class Socket extends tiny_events_1.EventEmitter {
    /** Create a websocket handler */
    constructor(options, resume = null) {
        super();
        this.resume = resume;
        this.sent = 0;
        this.lastPing = Date.now();
        this.subscriptions = {};
        this.handlers = [];
        /**
         * Open websocket connection, with optional retry interval.
         * Stores connection, setting up handlers for open/close/message events.
         * Resumes login if given token.
         */
        this.open = (ms = this.config.reopen) => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let connection;
                if (this.connection) {
                    this.connection.close(reopenCloseCode);
                }
                this.reopenInterval && clearInterval(this.reopenInterval);
                this.reopenInterval = setInterval(() => {
                    return !this.alive() && this.reopen();
                }, ms);
                try {
                    connection = new universal_websocket_client_1.default(this.host, null, { headers: settings.customHeaders });
                    connection.onerror = reject;
                }
                catch (err) {
                    this.logger.error(err);
                    return reject(err);
                }
                this.connection = connection;
                this.connection.onmessage = this.onMessage.bind(this);
                this.connection.onclose = this.onClose.bind(this);
                this.connection.onopen = this.onOpen.bind(this, resolve);
                this.emit('connecting');
            }));
        };
        /** Send handshake message to confirm connection, start pinging. */
        this.onOpen = (callback) => __awaiter(this, void 0, void 0, function* () {
            this.lastPing = Date.now();
            const connected = yield this.send({
                msg: 'connect',
                version: '1',
                support: ['1', 'pre2', 'pre1']
            });
            this.session = connected.session;
            this.ping().catch((err) => this.logger.error(`[ddp] Unable to ping server: ${err.message}`));
            this.emit('open');
            if (this.resume)
                yield this.login(this.resume);
            return callback(this.connection);
        });
        /** Emit close event so it can be used for promise resolve in close() */
        this.onClose = (e) => {
            this.emit('close', e);
            try {
                if ((e === null || e === void 0 ? void 0 : e.code) !== userDisconnectCloseCode) {
                    this.reopen();
                }
                this.logger.info(`[ddp] Close (${e === null || e === void 0 ? void 0 : e.code})`);
            }
            catch (error) {
                this.logger.error(error);
            }
        };
        /**
         * Find and call matching handlers for incoming message data.
         * Handlers match on collection, id and/or msg attribute in that order.
         * Any matched handlers are removed once called.
         * All collection events are emitted with their `msg` as the event name.
         */
        this.onMessage = (e) => {
            this.lastPing = Date.now();
            const data = (e.data) ? JSON.parse(e.data) : undefined;
            this.logger.debug(data); // 👈  very useful for debugging missing responses
            if (!data)
                return this.logger.error(`[ddp] JSON parse error: ${e.message}`);
            this.logger.debug(`[ddp] messages received: ${e.data}`);
            if (data.collection)
                this.emit(data.collection, data);
            if (data.msg)
                this.emit(data.msg, data);
            if (data.id)
                this.emit(data.id, data);
        };
        /** Disconnect the DDP from server and clear all subscriptions. */
        this.close = () => __awaiter(this, void 0, void 0, function* () {
            this.unsubscribeAll().catch(e => this.logger.debug(e));
            this.reopenInterval && clearInterval(this.reopenInterval);
            this.openTimeout && clearTimeout(this.openTimeout);
            this.pingTimeout && clearTimeout(this.pingTimeout);
            if (this.connected) {
                yield new Promise((resolve) => {
                    if (this.connection) {
                        this.once('close', resolve);
                        this.connection.close(userDisconnectCloseCode);
                    }
                })
                    .catch(this.logger.error);
            }
            return Promise.resolve();
        });
        this.checkAndReopen = () => !this.connected && this.reopen();
        /** Clear connection and try to connect again. */
        this.reopen = () => __awaiter(this, void 0, void 0, function* () {
            if (this.openTimeout)
                return;
            this.openTimeout = setTimeout(() => { delete this.openTimeout; }, this.config.reopen);
            yield this.open()
                .catch((err) => {
                this.logger.error(`[ddp] Reopen error: ${err.message}`);
                this.reopen();
            });
        });
        /**
         * Send an object to the server via Socket. Adds handler to collection to
         * allow awaiting response matching an expected object. Most responses are
         * identified by their message event name and the ID they were sent with, but
         * some responses don't return the ID fallback to just matching on event name.
         * Data often includes an error attribute if something went wrong, but certain
         * types of calls send back a different `msg` value instead, e.g. `nosub`.
         * @param obj       Object to be sent
         * @param msg       The `data.msg` value to wait for in response
         * @param errorMsg  An alternate `data.msg` value indicating an error response
         */
        this.send = (obj) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!this.connection)
                    throw new Error('[ddp] sending without open connection');
                if (!this.connected)
                    yield new Promise(resolve => this.on('open', resolve));
                const id = obj.id || `ddp-${this.sent}`;
                this.sent += 1;
                const data = Object.assign(Object.assign({}, obj), (/connect|ping|pong/.test(obj.msg) ? {} : { id }));
                const stringdata = JSON.stringify(data);
                this.logger.debug(`[ddp] sending message: ${stringdata}`);
                if (/^sub$/.test(obj.msg)) {
                    const { name, params } = obj;
                    this.subscriptions[id] = { id, name, params, unsubscribe: this.unsubscribe.bind(this, id) };
                }
                try {
                    this.connection.send(stringdata);
                }
                catch (_a) {
                    this.logger.error('[ddp] send without open connection');
                }
                this.once('disconnected', reject);
                const listener = (data.msg === 'ping' && 'pong') || (data.msg === 'connect' && 'connected') || data.id;
                if (!listener) {
                    return resolve();
                }
                this.once(listener, (result) => {
                    this.off('disconnect', reject);
                    return (result.error ? reject(result.error) : resolve(Object.assign(Object.assign({}, (/connect|ping|pong/.test(obj.msg) ? {} : { id })), result)));
                });
            }));
        });
        /** Send ping, record time, re-open if nothing comes back, repeat */
        this.ping = () => __awaiter(this, void 0, void 0, function* () {
            this.pingTimeout && clearTimeout(this.pingTimeout);
            this.pingTimeout = setTimeout(() => {
                this.send({ msg: 'ping' })
                    .then(() => this.ping())
                    .catch(() => this.reopen());
            }, this.config.ping);
        });
        /** Check if ping-pong to server is within tolerance of 1 missed ping */
        this.alive = () => {
            if (!this.lastPing)
                return false;
            return (Date.now() - this.lastPing <= this.config.ping * 2);
        };
        /**
         * Calls a method on the server and returns a promise resolved
         * with the result of the method.
         * @param method    The name of the method to be called
         * @param params    An array with the parameters to be sent
         */
        this.call = (method, ...params) => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.send({ msg: 'method', method, params })
                .catch((err) => {
                this.logger.error(`[ddp] Call error: ${err.message}`);
                throw err;
            });
            return (response.result) ? response.result : response;
        });
        /**
         * Login to server and resubscribe to all subs, resolve with user information.
         * @param credentials User credentials (username/password, oauth or token)
         */
        this.login = (credentials) => __awaiter(this, void 0, void 0, function* () {
            const params = this.loginParams(credentials);
            this.resume = (yield this.call('login', params));
            yield this.subscribeAll();
            this.emit('login', this.resume);
            return this.resume;
        });
        /** Take variety of login credentials object types for accepted params */
        this.loginParams = (credentials) => {
            if (interfaces_1.isLoginPass(credentials) ||
                interfaces_1.isLoginOAuth(credentials) ||
                interfaces_1.isLoginAuthenticated(credentials)) {
                return credentials;
            }
            if (interfaces_1.isLoginResult(credentials)) {
                const params = {
                    resume: credentials.token
                };
                return params;
            }
            const params = {
                user: { username: credentials.username },
                password: {
                    digest: js_sha256_1.sha256(credentials.password),
                    algorithm: 'sha-256'
                }
            };
            return params;
        };
        /** Logout the current User from the server via Socket. */
        this.logout = () => {
            this.resume = null;
            return this.unsubscribeAll()
                .then(() => this.call('logout'));
        };
        /** Register a callback to trigger on message events in subscription */
        this.onEvent = (id, callback) => {
            this.on(id, callback);
        };
        /**
         * Subscribe to a stream on server via socket and returns a promise resolved
         * with the subscription object when the subscription is ready.
         * @param name      Stream name to subscribe to
         * @param params    Params sent to the subscription request
         */
        this.subscribe = (name, params, callback, id) => {
            this.logger.info(`[ddp] Subscribe to ${name}, param: ${JSON.stringify(params)}`);
            return this.send({ msg: 'sub', id, name, params })
                .then((result) => {
                const id = (result.subs) ? result.subs[0] : undefined;
                if (id) {
                    const unsubscribe = this.unsubscribe.bind(this, id);
                    const onEvent = this.onEvent.bind(this, name);
                    const subscription = { id, name, params, unsubscribe, onEvent };
                    if (callback)
                        subscription.onEvent(callback);
                    this.subscriptions[id] = subscription;
                    return subscription;
                }
            })
                .catch((err) => {
                this.logger.error(`[ddp] Subscribe error: ${err.message}`);
                // throw err
            });
        };
        /** Subscribe to all pre-configured streams (e.g. on login resume) */
        this.subscribeAll = () => {
            const subscriptions = Object.keys(this.subscriptions || {}).map((key) => {
                const { name, params, id } = this.subscriptions[key];
                return this.subscribe(name, params, undefined, id);
            });
            return Promise.all(subscriptions);
        };
        /** Unsubscribe to server stream, resolve with unsubscribe request result */
        this.unsubscribe = (id) => {
            if (!this.subscriptions[id])
                return Promise.reject(id);
            delete this.subscriptions[id];
            return this.send({ msg: 'unsub', id })
                .then((data) => data.result || data.subs)
                .catch((err) => {
                if (!err.msg && err.msg !== 'nosub') {
                    this.logger.error(`[ddp] Unsubscribe error: ${err.message}`);
                    throw err;
                }
            });
        };
        /** Unsubscribe from all active subscriptions and reset collection */
        this.unsubscribeAll = () => {
            const unsubAll = Object.keys(this.subscriptions).map((id) => {
                return this.subscriptions[id].unsubscribe();
            });
            return Promise.all(unsubAll)
                .then(() => this.subscriptions = {});
        };
        this.logger = options.logger || log_1.logger;
        this.config = {
            host: options.host || 'http://localhost:3000',
            useSsl: options.useSsl || false,
            reopen: options.reopen || 10000,
            ping: options.timeout || 30000
        };
        this.host = `${util_1.hostToWS(this.config.host, this.config.useSsl)}/websocket`;
        this.on('ping', () => {
            this.lastPing = Date.now();
            this.send({ msg: 'pong' }).then(this.logger.debug, this.logger.error);
        });
        this.on('result', (data) => this.emit(data.id, { id: data.id, result: data.result, error: data.error }));
        this.on('ready', (data) => this.emit(data.subs[0], data));
    }
    /** Check if websocket connected and ready. */
    get connected() {
        return !!(this.connection &&
            this.connection.readyState === 1 &&
            this.alive());
    }
    /** Check if connected and logged in */
    get loggedIn() {
        return (this.connected && !!this.resume);
    }
}
exports.Socket = Socket;
class DDPDriver extends tiny_events_1.EventEmitter {
    constructor(_a = {}) {
        var { host = 'localhost:3000', integrationId, config, logger = log_1.logger } = _a, moreConfigs = __rest(_a, ["host", "integrationId", "config", "logger"]);
        super();
        /**
         * Websocket subscriptions, exported for direct polling by adapters
         * Variable not initialised until `prepMeteorSubscriptions` called.
         * @deprecated Use `ddp.Socket` instance subscriptions instead.
         */
        this.subscriptions = {};
        /** Current user object populated from resolved login */
        this.userId = '';
        /** Array of joined room IDs (for reactive queries) */
        this.joinedIds = [];
        /**
         * Initialise socket instance with given options or defaults.
         * Proxies the DDP module socket connection. Resolves with socket when open.
         * Accepts callback following error-first-pattern.
         * Error returned or promise rejected on timeout.
         * @example <caption>Using promise</caption>
         *  import { driver } from '@rocket.chat/sdk'
         *  driver.connect()
         *    .then(() => console.log('connected'))
         *    .catch((err) => console.error(err))
         */
        this.connect = (c = {}) => {
            if (this.connected) {
                return Promise.resolve(this);
            }
            const config = Object.assign(Object.assign({}, this.config), c); // override defaults
            return new Promise((resolve, reject) => {
                this.logger.info('[driver] Connecting', config);
                this.subscriptions = this.ddp.subscriptions;
                this.ddp.open().catch((err) => {
                    this.logger.error(`[driver] Failed to connect: ${err.message}`);
                    reject(err);
                });
                this.ddp.on('open', () => this.emit('connected')); // echo ddp event
                let cancelled = false;
                const rejectionTimeout = setTimeout(() => {
                    this.logger.info(`[driver] Timeout (${config.timeout})`);
                    const err = new Error('Socket connection timeout');
                    cancelled = true;
                    reject(err);
                }, config.timeout);
                // if to avoid condition where timeout happens before listener to 'connected' is added
                // and this listener is not removed (because it was added after the removal)
                if (!cancelled) {
                    this.once('connected', () => {
                        this.logger.info('[driver] Connected');
                        if (cancelled)
                            return this.ddp.close(); // cancel if already rejected
                        clearTimeout(rejectionTimeout);
                        resolve(this);
                    });
                }
            });
        };
        this.disconnect = () => {
            return this.ddp.close();
        };
        this.checkAndReopen = () => {
            // @ts-ignore
            return this.ddp.checkAndReopen();
        };
        this.subscribe = (topic, eventname, ...args) => {
            this.logger.info(`[DDP driver] Subscribing to ${topic} | ${JSON.stringify(args)}`);
            // @ts-ignore
            return this.ddp.subscribe(topic, [eventname, { 'useCollection': false, 'args': args }]);
        };
        this.subscribeNotifyAll = () => {
            const topic = 'stream-notify-all';
            return Promise.all([
                'roles-change',
                'updateEmojiCustom',
                'deleteEmojiCustom',
                'updateAvatar',
                'public-settings-changed',
                'permissions-changed'
            ].map(event => this.subscribe(topic, event, false)));
        };
        this.subscribeLoggedNotify = () => {
            const topic = 'stream-notify-logged';
            return Promise.all([
                'Users:NameChanged',
                'Users:Deleted',
                'updateAvatar',
                'updateEmojiCustom',
                'deleteEmojiCustom',
                'roles-change'
            ].map(event => this.subscribe(topic, event, false)));
        };
        this.subscribeNotifyUser = () => {
            const topic = 'stream-notify-user';
            return Promise.all([
                'message',
                'otr',
                'webrtc',
                'notification',
                'rooms-changed',
                'subscriptions-changed',
                'uiInteraction',
                'e2ekeyRequest',
                'userData'
            ].map(event => this.subscribe(topic, `${this.userId}/${event}`, false)));
        };
        this.subscribeRoom = (rid, ...args) => {
            const topic = 'stream-notify-room';
            return Promise.all([
                this.subscribe('stream-room-messages', rid, ...args),
                this.subscribe(topic, `${rid}/typing`, ...args),
                this.subscribe(topic, `${rid}/deleteMessage`, ...args)
            ]);
        };
        /** Login to Rocket.Chat via DDP */
        this.login = (credentials, args) => __awaiter(this, void 0, void 0, function* () {
            if (!this.ddp || !this.ddp.connected) {
                yield this.connect();
            }
            this.logger.info(`[DDP driver] Login with ${JSON.stringify(credentials)}`);
            const login = yield this.ddp.login(credentials);
            this.userId = login.id;
            return login;
        });
        this.logout = () => __awaiter(this, void 0, void 0, function* () {
            if (this.ddp && this.ddp.connected) {
                yield this.ddp.logout();
            }
        });
        /** Unsubscribe from Meteor stream. Proxy for socket unsubscribe. */
        this.unsubscribe = (subscription) => {
            return this.ddp.unsubscribe(subscription.id);
        };
        /** Unsubscribe from all subscriptions. Proxy for socket unsubscribeAll */
        this.unsubscribeAll = () => {
            return this.ddp.unsubscribeAll();
        };
        this.onStreamData = (event, cb) => {
            function listener(message) {
                cb((message));
            }
            return Promise.resolve(this.ddp.on(event, listener))
                .then(() => ({
                stop: () => this.ddp.off(event, listener)
            }));
        };
        this.onMessage = (cb) => {
            this.ddp.on('stream-room-messages', ({ fields: { args: [message] } }) => cb(this.ejsonMessage(message)));
        };
        this.onTyping = (cb) => {
            return this.ddp.on('stream-notify-room', ({ fields: { args: [username, isTyping] } }) => {
                cb(username, isTyping);
            });
        };
        this.notifyVisitorTyping = (rid, username, typing, token) => {
            return this.ddp.call('stream-notify-room', `${rid}/typing`, username, typing, { token });
        };
        this.ejsonMessage = (message) => {
            if (message.ts) {
                message.ts = new Date(message.ts.$date);
            }
            return message;
        };
        this.methodCall = (method, ...args) => {
            return this.ddp.call(method, ...args);
        };
        this.config = Object.assign(Object.assign(Object.assign({}, config), moreConfigs), { host: host.replace(/(^\w+:|^)\/\//, ''), timeout: 20000 });
        this.ddp = new Socket(Object.assign(Object.assign({}, this.config), { logger }));
        this.logger = logger;
    }
    get connected() {
        return !!this.ddp.connected;
    }
}
exports.DDPDriver = DDPDriver;
//# sourceMappingURL=ddp.js.map
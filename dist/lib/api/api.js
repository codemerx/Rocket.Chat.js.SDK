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
Object.defineProperty(exports, "__esModule", { value: true });
exports.regExpSuccess = void 0;
const log_1 = require("../log");
const message_1 = require("../message");
const tiny_events_1 = require("tiny-events");
const settings = __importStar(require("../settings"));
class Client {
    constructor({ host = 'http://localhost:3000' }) {
        this._headers = {};
        this.host = host;
    }
    set headers(obj) {
        this._headers = obj;
    }
    get headers() {
        return Object.assign(Object.assign({ 'Content-Type': 'application/json' }, settings.customHeaders), this._headers);
    }
    getHeaders(options) {
        return options && options.customHeaders ?
            options.customHeaders :
            this.headers;
    }
    getBody(data) {
        return data instanceof FormData ?
            data :
            JSON.stringify(data);
    }
    getSignal(options) {
        return options && options.signal;
    }
    get(url, data, options) {
        return fetch(`${this.host}/api/v1/${encodeURI(url)}?${this.getParams(data)}`, {
            method: 'GET',
            headers: this.getHeaders(options),
            signal: this.getSignal(options)
        }).then(this.handle);
    }
    post(url, data, options) {
        return fetch(`${this.host}/api/v1/${encodeURI(url)}`, {
            method: 'POST',
            body: this.getBody(data),
            headers: this.getHeaders(options),
            signal: this.getSignal(options)
        }).then(this.handle);
    }
    put(url, data, options) {
        return fetch(`${this.host}/api/v1/${encodeURI(url)}`, {
            method: 'PUT',
            body: this.getBody(data),
            headers: this.getHeaders(options),
            signal: this.getSignal(options)
        }).then(this.handle);
    }
    delete(url, data, options) {
        return fetch(`${this.host}/api/v1/${encodeURI(url)}`, {
            method: 'DELETE',
            body: this.getBody(data),
            headers: this.getHeaders(options),
            signal: this.getSignal(options)
        }).then(this.handle);
    }
    handle(r) {
        return __awaiter(this, void 0, void 0, function* () {
            const { status } = r;
            const data = yield r.json();
            return { status, data };
        });
    }
    getParams(data) {
        return Object.keys(data).map(function (k) {
            return encodeURIComponent(k) + '=' + (typeof data[k] === 'object' ? encodeURIComponent(JSON.stringify(data[k])) : encodeURIComponent(data[k]));
        }).join('&');
    }
}
exports.regExpSuccess = /(?!([45][0-9][0-9]))\d{3}/;
/**
    * @module API
    * Provides a base client for handling requests with generic Rocket.Chat's REST API
    */
class Api extends tiny_events_1.EventEmitter {
    constructor({ client, host, logger = log_1.logger }) {
        super();
        this.userId = '';
        this.currentLogin = null;
        /**
            * Do a request to an API endpoint.
            * If it needs a token, login first (with defaults) to set auth headers.
            * @param method   Request method GET | POST | PUT | DEL
            * @param endpoint The API endpoint (including version) e.g. `chat.update`
            * @param data     Payload for POST request to endpoint
            * @param auth     Require auth headers for endpoint, default true
            * @param ignore   Allows certain matching error messages to not count as errors
            */
        this.request = (method, endpoint, data = {}, auth = true, ignore, options) => __awaiter(this, void 0, void 0, function* () {
            this.logger && this.logger.debug(`[API] ${method} ${endpoint}: ${JSON.stringify(data)}`);
            try {
                if (auth && !this.loggedIn()) {
                    throw new Error('');
                }
                const { signal } = this.controller;
                options = Object.assign(Object.assign({}, options), { signal });
                let result;
                switch (method) {
                    case 'GET':
                        result = yield this.client.get(endpoint, data, options);
                        break;
                    case 'PUT':
                        result = yield this.client.put(endpoint, data, options);
                        break;
                    case 'DELETE':
                        result = yield this.client.delete(endpoint, data, options);
                        break;
                    default:
                    case 'POST':
                        result = yield this.client.post(endpoint, data, options);
                        break;
                }
                if (!result)
                    throw new Error(`API ${method} ${endpoint} result undefined`);
                if (!this.success(result, ignore))
                    throw result;
                this.logger && this.logger.debug(`[API] ${method} ${endpoint} result ${result.status}`);
                const hasDataInsideResult = result && !result.data;
                return (method === 'DELETE') && hasDataInsideResult ? result : result.data;
            }
            catch (err) {
                this.logger && this.logger.error(`[API] POST error(${endpoint}): ${JSON.stringify(err)}`);
                throw err;
            }
        });
        /** Do a POST request to an API endpoint. */
        this.post = (endpoint, data, auth, ignore, options = {}) => this.request('POST', endpoint, data, auth, ignore, options);
        /** Do a GET request to an API endpoint. */
        this.get = (endpoint, data, auth, ignore, options = {}) => this.request('GET', endpoint, data, auth, ignore, options);
        /** Do a PUT request to an API endpoint. */
        this.put = (endpoint, data, auth, ignore, options = {}) => this.request('PUT', endpoint, data, auth, ignore, options);
        /** Do a DELETE request to an API endpoint. */
        this.del = (endpoint, data, auth, ignore, options = {}) => this.request('DELETE', endpoint, data, auth, ignore, options);
        /** Abort all current API requests. */
        this.abort = () => this.controller.abort();
        this.client = client || new Client({ host });
        this.logger = log_1.logger;
        this.controller = new AbortController();
    }
    get username() {
        return this.currentLogin && this.currentLogin.username;
    }
    loggedIn() {
        return Object.keys(this.currentLogin || {}).every((e) => e);
    }
    /** Check result data for success, allowing override to ignore some errors */
    success(result, ignore) {
        return (typeof result.status === 'undefined' ||
            (result.status && exports.regExpSuccess.test(result.status)) ||
            (result.status && ignore && ignore.test(result.status))) ? true : false;
    }
    login(credentials, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield this.post('login', Object.assign(Object.assign({}, credentials), args));
            this.userId = data.userId;
            this.currentLogin = {
                username: data.me.username,
                userId: data.userId,
                authToken: data.authToken,
                result: data
            };
            this.client.headers = {
                'X-Auth-Token': data.authToken,
                'X-User-Id': data.userId
            };
            return data;
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentLogin) {
                return null;
            }
            const result = yield this.post('logout', {}, true);
            this.userId = '';
            this.currentLogin = null;
            return result;
        });
    }
    /**
     * Structure message content, optionally addressing to room ID.
     * Accepts message text string or a structured message object.
     */
    prepareMessage(content, rid, args) {
        return new message_1.Message(content, Object.assign({ rid, roomId: rid }, args));
    }
}
exports.default = Api;
//# sourceMappingURL=api.js.map
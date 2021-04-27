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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rocketchat = exports.Bot = exports.Livechat = exports.settings = void 0;
const settings = __importStar(require("./lib/settings"));
exports.settings = settings;
const Livechat_1 = __importDefault(require("./lib/clients/Livechat"));
exports.Livechat = Livechat_1.default;
const Bot_1 = __importDefault(require("./lib/clients/Bot"));
exports.Bot = Bot_1.default;
const Rocketchat_1 = __importDefault(require("./lib/clients/Rocketchat"));
exports.Rocketchat = Rocketchat_1.default;
//# sourceMappingURL=index.js.map
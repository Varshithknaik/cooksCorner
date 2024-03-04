"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const encrypt = (text) => {
    return crypto_js_1.default.AES.encrypt(text, process.env.ENCRYPTION_KEY).toString();
};
exports.encrypt = encrypt;
const decrypt = (encrypted) => {
    const bytes = crypto_js_1.default.AES.decrypt(encrypted, process.env.ENCRYPTION_KEY);
    return bytes.toString(crypto_js_1.default.enc.Utf8);
};
exports.decrypt = decrypt;

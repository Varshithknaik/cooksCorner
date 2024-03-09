"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationValidation = exports.handleError = exports.handleTryCatchError = void 0;
const errorHandler_1 = __importDefault(require("./errorHandler"));
const handleTryCatchError = (error, next) => {
    return next((0, exports.handleError)(error.message, 400));
};
exports.handleTryCatchError = handleTryCatchError;
const handleError = (message, status) => {
    return new errorHandler_1.default(message, status);
};
exports.handleError = handleError;
const authorizationValidation = (auth) => {
    if (auth.length !== 2 || !auth[0].startsWith('Bearer')) {
        throw (0, exports.handleError)('Invalid authorization header', 400);
    }
    return auth[1];
};
exports.authorizationValidation = authorizationValidation;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = void 0;
const utilFunction_1 = require("../utils/utilFunction");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../utils/redis");
const verify = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization ?? '';
        if (!authorization) {
            next((0, utilFunction_1.handleError)('Invalid token', 403));
        }
        const auth = (0, utilFunction_1.authorizationValidation)(authorization.split(' '));
        const decoded = await jsonwebtoken_1.default.verify(auth, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            next((0, utilFunction_1.handleError)('Invalid token', 403));
        }
        const user = await redis_1.redis.get(decoded.id) ?? '';
        if (!user) {
            next((0, utilFunction_1.handleError)('Invalid token', 403));
        }
        req.user = JSON.parse(user);
        next();
    }
    catch (error) {
        (0, utilFunction_1.handleTryCatchError)(error.message, next);
    }
};
exports.verify = verify;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const ErrorMiddleware = (err, req, res) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    // Wrong MongoDB id error
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid ${err.path}`;
        err = new errorHandler_1.default(message, 404);
    }
    //Duplicate Error
    if (err.code === 11000) {
        const message = `Resource already exists. ${err.errmsg}`;
        err = new errorHandler_1.default(message, 409);
    }
    // Invalid JWT token
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid JWT token";
        err = new errorHandler_1.default(message, 400);
    }
    // Jwt Expiration
    if (err.name === "TokenExpiredError") {
        const message = "Json Wen Token is Expired, try again";
        err = new errorHandler_1.default(message, 400);
    }
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
exports.ErrorMiddleware = ErrorMiddleware;

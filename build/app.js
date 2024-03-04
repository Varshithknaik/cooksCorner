"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
exports.app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = require("express-rate-limit");
const error_1 = require("./middleware/error");
//body-parsers
exports.app.use(express_1.default.json({ limit: '50mb' }));
// cookie-parser
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'https://cookscorner-client.onrender.com/']
}));
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        error: 'Too many requests, please try again later'
    },
});
exports.app.get('/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is Working Fine"
    });
});
exports.app.all('*', (req, res, next) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode(404);
    next(err);
});
exports.app.use(limiter);
exports.app.use(error_1.ErrorMiddleware);

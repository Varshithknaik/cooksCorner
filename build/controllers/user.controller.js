"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.userInfo = exports.logout = exports.login = exports.validateAccount = exports.sendActivationEmail = exports.generateActivationCode = exports.generateActivationToken = exports.checkIfEmailExists = exports.validateInput = exports.registration = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = __importDefault(require("../model/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const utilFunction_1 = require("../utils/utilFunction");
const sendToken_1 = require("../utils/sendToken");
const redis_1 = require("../utils/redis");
const encryption_1 = require("../utils/encryption");
dotenv_1.default.config();
const registration = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        (0, exports.validateInput)(name, email);
        await (0, exports.checkIfEmailExists)(email);
        const activationCode = (0, exports.generateActivationCode)();
        const payload = { email, activationCode };
        const activationToken = (0, exports.generateActivationToken)(payload, '1h');
        await (0, exports.sendActivationEmail)(email, name, activationCode);
        res.status(201).json({
            status: 'success',
            token: activationToken
        });
    }
    catch (error) {
        (0, utilFunction_1.handleTryCatchError)(error, next);
    }
};
exports.registration = registration;
const validateInput = (...args) => {
    if (args.some(args => !args)) {
        throw (0, utilFunction_1.handleError)('Please fill in all the fields', 400);
    }
};
exports.validateInput = validateInput;
const checkIfEmailExists = async (email) => {
    const isEmailExist = await user_model_1.default.findOne({ email });
    if (isEmailExist && Object.keys(isEmailExist).length !== 0) {
        throw (0, utilFunction_1.handleError)('Email already exists', 400);
    }
};
exports.checkIfEmailExists = checkIfEmailExists;
const generateActivationToken = (payload, expiration) => {
    return jsonwebtoken_1.default.sign(payload, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret', { expiresIn: expiration });
};
exports.generateActivationToken = generateActivationToken;
const generateActivationCode = () => {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    return activationCode;
};
exports.generateActivationCode = generateActivationCode;
const sendActivationEmail = async (email, name, activationCode) => {
    const data = { name, activationCode };
    await (0, sendMail_1.default)({
        email,
        subject: 'Account Activation',
        template: 'activation-mail.ejs',
        data
    });
};
exports.sendActivationEmail = sendActivationEmail;
const validateAccount = async (req, res, next) => {
    try {
        const { password, name, activationCode } = req.body;
        const authorizationHeader = req.headers.authorization ?? '';
        const auth = (0, utilFunction_1.authorizationValidation)(authorizationHeader.split(' '));
        (0, exports.validateInput)(password, name, activationCode);
        const { email, activationCode: code } = jsonwebtoken_1.default.verify(auth, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret');
        if (activationCode !== code) {
            throw (0, utilFunction_1.handleError)('Invalid activation code', 400);
        }
        await user_model_1.default.create({ name, email, password });
        res.status(201).json({
            status: 'success',
            message: 'Account validated'
        });
    }
    catch (error) {
        (0, utilFunction_1.handleTryCatchError)(error, next);
    }
};
exports.validateAccount = validateAccount;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        (0, exports.validateInput)(email, password);
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            throw (0, utilFunction_1.handleError)('User does not exist', 400);
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw (0, utilFunction_1.handleError)('Invalid email or password', 400);
        }
        (0, sendToken_1.sendToken)(user, 201, res);
    }
    catch (error) {
        (0, utilFunction_1.handleTryCatchError)(error, next);
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        res.cookie('refreshToken', '', { maxAge: 1 });
        const userId = req.user?._id ?? '';
        await redis_1.redis.del(userId);
        res.status(200).json({
            status: 'success',
            message: 'Logout successful'
        });
    }
    catch (error) {
        (0, utilFunction_1.handleTryCatchError)(error, next);
    }
};
exports.logout = logout;
const userInfo = async (req, res, next) => {
    const encryptedBody = (0, encryption_1.encrypt)(JSON.stringify(req.user));
    try {
        res.status(200).json({
            status: 'success',
            data: encryptedBody
        });
    }
    catch (error) {
        (0, utilFunction_1.handleTryCatchError)(error, next);
    }
};
exports.userInfo = userInfo;
const refresh = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        const decoded = await jsonwebtoken_1.default.sign(token, process.env.REFRESH_TOKEN_SECRET ?? 'secret');
        if (!decoded) {
            next((0, utilFunction_1.handleError)('Could not refresh the token', 401));
        }
        const session = await redis_1.redis.get(decoded?._id);
        if (!session) {
            next((0, utilFunction_1.handleError)('Session expired please login again', 401));
        }
        const user = JSON.parse(session);
        const refreshToken = await (0, exports.generateActivationToken)({ _id: user._id }, '7d');
        const accessToken = await (0, exports.generateActivationToken)({ _id: user._id }, '5m');
        await redis_1.redis.set(user._id, JSON.stringify(user), 'EX', 60 * 60 * 24 * 7);
        res.cookie('refreshToken', refreshToken, sendToken_1.refreshTokenCookieOptions);
        res.status(200).json({
            status: 'success',
            accessToken
        });
    }
    catch (error) {
        (0, utilFunction_1.handleTryCatchError)(error, next);
    }
};
exports.refresh = refresh;

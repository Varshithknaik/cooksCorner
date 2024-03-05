"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccount = exports.handleError = exports.handleTryCatchError = exports.sendActivationEmail = exports.generateActivationCode = exports.generateActivationToken = exports.checkIfEmailExists = exports.validateInput = exports.registration = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const user_model_1 = __importDefault(require("../model/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
dotenv_1.default.config();
const registration = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        (0, exports.validateInput)(name, email);
        await (0, exports.checkIfEmailExists)(email);
        const activationCode = (0, exports.generateActivationCode)();
        const activationToken = (0, exports.generateActivationToken)(email, activationCode);
        await (0, exports.sendActivationEmail)(email, name, activationCode);
        res.status(201).json({
            status: 'success',
            token: activationToken
        });
    }
    catch (error) {
        (0, exports.handleTryCatchError)(error, next);
    }
};
exports.registration = registration;
const validateInput = (...args) => {
    if (args.some(args => !args)) {
        throw (0, exports.handleError)('Please fill in all the fields', 400);
    }
};
exports.validateInput = validateInput;
const checkIfEmailExists = async (email) => {
    const isEmailExist = await user_model_1.default.findOne({ email });
    if (isEmailExist && Object.keys(isEmailExist).length !== 0) {
        throw (0, exports.handleError)('Email already exists', 400);
    }
};
exports.checkIfEmailExists = checkIfEmailExists;
const generateActivationToken = (email, activationCode) => {
    const payload = { email, activationCode };
    return jsonwebtoken_1.default.sign(payload, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret', { expiresIn: '1h' });
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
const handleTryCatchError = (error, next) => {
    return next((0, exports.handleError)(error.message, 400));
};
exports.handleTryCatchError = handleTryCatchError;
const handleError = (message, status) => {
    return new errorHandler_1.default(message, status);
};
exports.handleError = handleError;
const validateAccount = async (req, res, next) => {
    try {
        const { password, name, activationCode } = req.body;
        const authorizationHeader = req.headers.authorization ?? '';
        (0, exports.validateInput)(password, name, activationCode);
        const { email, activationCode: code } = jsonwebtoken_1.default.verify(authorizationHeader, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret');
        if (activationCode !== code) {
            throw (0, exports.handleError)('Invalid activation code', 400);
        }
        await user_model_1.default.create({ name, email, password });
        res.status(201).json({
            status: 'success',
            message: 'Account created successfully'
        });
    }
    catch (error) {
        (0, exports.handleTryCatchError)(error, next);
    }
};
exports.validateAccount = validateAccount;

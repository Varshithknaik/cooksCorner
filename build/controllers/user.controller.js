"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registration = void 0;
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
        validateInput(name, email);
        await checkIfEmailExists(email);
        const activationToken = generateActivationToken(email);
        const activationCode = generateActivationCode();
        await sendActivationEmail(email, name, activationCode);
        res.status(201).json({
            message: 'Registration successful',
            data: {
                activationToken,
                activationCode
            }
        });
    }
    catch (error) {
        handleRegistrationError(error, next);
    }
};
exports.registration = registration;
const validateInput = (name, email) => {
    if (!name || !email) {
        throw handleError('Please fill in all the fields', 400);
    }
};
const checkIfEmailExists = async (email) => {
    const isEmailExist = await user_model_1.default.findOne({ email });
    if (isEmailExist) {
        throw handleError('Email already exists', 400);
    }
};
const generateActivationToken = (email) => {
    const payload = { email };
    return jsonwebtoken_1.default.sign(payload, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret', { expiresIn: '1h' });
};
const generateActivationCode = () => {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    return activationCode;
};
const sendActivationEmail = async (email, name, activationCode) => {
    const data = { name, activationCode };
    await (0, sendMail_1.default)({
        email,
        subject: 'Account Activation',
        template: 'activation-mail.ejs',
        data
    });
};
const handleRegistrationError = (error, next) => {
    return next(handleError(error.message, 400));
};
const handleError = (message, status) => {
    return new errorHandler_1.default(message, status);
};

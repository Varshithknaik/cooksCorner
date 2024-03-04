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
const encryption_1 = require("../utils/encryption");
const sendMail_1 = __importDefault(require("../utils/sendMail"));
dotenv_1.default.config();
// Registration handler
const registration = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        // Validate input fields
        if (!name || !email || !password) {
            return next(new errorHandler_1.default('please fill all the fields', 400));
        }
        // Check if email already exists
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist) {
            return next(new errorHandler_1.default('email already exist', 400));
        }
        // Encrypt password
        const encrypedPassword = (0, encryption_1.encrypt)(password);
        // Prepare payload for JWT
        const payload = {
            name,
            email,
            password: encrypedPassword,
        };
        // Generate and sign JWT
        const activationToken = jsonwebtoken_1.default.sign(payload, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret', { expiresIn: '1h' });
        // Generate activation code
        const { activationCode } = tokenGenerator();
        // Prepare data for email
        const data = {
            name,
            activationCode,
        };
        // Send activation email
        await (0, sendMail_1.default)({
            email,
            subject: 'Account Activation',
            template: 'activation-mail.ejs',
            data,
        });
        // Send success response
        res.status(200).json({
            status: 'success',
            token: activationToken,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
};
exports.registration = registration;
// Function to generate activation code
const tokenGenerator = () => {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    return { activationCode };
};

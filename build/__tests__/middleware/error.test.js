"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../../model/user.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Mocking bcrypt and jwt for testing
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('token'),
}));
describe('userModel Model', () => {
    beforeAll(async () => {
        await mongoose_1.default.connect(process.env.DB_URL ?? '', {});
    });
    afterAll(async () => {
        await mongoose_1.default.connection.close();
    });
    it('should hash the password before saving the userModel', async () => {
        const user = new user_model_1.default({ name: 'Test', email: 'test@example.com', password: 'testPassword' });
        await user.save();
        expect(bcryptjs_1.default.hash).toHaveBeenCalledWith('testPassword', 'salt');
        expect(user.password).toBe('hashedPassword');
        await user_model_1.default.deleteOne({ _id: user._id });
    });
    it('should compare the password correctly', async () => {
        const user = new user_model_1.default({ name: 'Test', email: 'test@example.com', password: 'hashedPassword' });
        const isMatch = await user.comparePassword('testPassword');
        expect(bcryptjs_1.default.compare).toHaveBeenCalledWith('testPassword', 'hashedPassword');
        expect(isMatch).toBe(true);
    });
    it('should sign the access token correctly', async () => {
        const user = new user_model_1.default({ name: 'Test', email: 'test@example.com', password: 'hashedPassword' });
        const token = user.signAccessToken();
        expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
        expect(token).toBe('token');
    });
    it('should sign the refresh token correctly', async () => {
        const user = new user_model_1.default({ name: 'Test', email: 'test@example.com', password: 'hashedPassword' });
        const token = user.signRefreshToken();
        expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
        expect(token).toBe('token');
    });
});

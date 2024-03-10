"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_controller_1 = require("../../controllers/user.controller");
const user_model_1 = __importDefault(require("../../model/user.model"));
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendToken_1 = require("../../utils/sendToken");
const redis_1 = require("../../utils/redis");
jest.mock('../../model/user.model');
jest.mock('../../utils/errorHandler', () => {
    return jest.fn().mockImplementation((message, statusCode) => {
        return { message, statusCode };
    });
});
jest.mock('../../utils/sendToken');
const setupReq = (authorization, body = {}, user) => {
    return {
        body,
        headers: {
            authorization: `Bearer ${authorization}`,
        },
        user
    };
};
const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
};
describe('Registration user', () => {
    const next = jest.fn();
    it('should return 201 and a token', async () => {
        const req = setupReq('', { name: 'testUser', email: 'test2@gmail.com' });
        user_model_1.default.findOne = jest.fn().mockResolvedValue({});
        await (0, user_controller_1.registration)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            token: expect.any(String),
        });
    }, 50000);
    it('should throw error if parameter is empty', async () => {
        const req = setupReq('', { name: 'testUser' });
        const next = jest.fn();
        await (0, user_controller_1.registration)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Please fill in all the fields', 400);
    });
    it('should throw error if user exist', async () => {
        const req = {
            body: {
                name: 'testUser',
                email: 'test@user',
            },
        };
        const next = jest.fn();
        user_model_1.default.findOne = jest.fn().mockResolvedValue({ _id: 1, name: 'testUser' });
        await (0, user_controller_1.registration)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Email already exists', 400);
    });
});
describe('validateAccount ', () => {
    const next = jest.fn();
    it('should be able to validate account', async () => {
        const req = setupReq('123456', {
            name: 'testUser',
            password: 'password',
            activationCode: '123456',
        });
        jsonwebtoken_1.default.verify = jest.fn().mockReturnValue({ email: 'mockedEmail', activationCode: '123456' });
        user_model_1.default.create = jest.fn().mockResolvedValue({ _id: 1, name: 'testUser' });
        await (0, user_controller_1.validateAccount)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Account validated',
        });
    });
    it('should throw error if parameter is empty', async () => {
        const req = setupReq('123456', {
            name: 'testUser',
            password: 'password',
        });
        const next = jest.fn();
        await (0, user_controller_1.validateAccount)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });
    it('should throw error if token is invalid', async () => {
        const req = setupReq('Bearer 123456', {
            name: 'testUser',
            password: 'password',
            activationCode: '123456',
        });
        const next = jest.fn();
        jsonwebtoken_1.default.verify = jest.fn().mockImplementation(() => { throw new Error('Token invalid'); });
        await (0, user_controller_1.validateAccount)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Invalid authorization header', 400);
    });
});
describe('login', () => {
    it('should throw error if any parameter is missing', async () => {
        const req = setupReq('', { email: 'test@user.com', password: '' });
        const next = jest.fn();
        await (0, user_controller_1.login)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Please fill in all the fields', 400);
    });
    it('should throw error if user not exist', async () => {
        const req = setupReq('', { email: 'test@user.com', password: 'password' });
        const next = jest.fn();
        user_model_1.default.findOne = jest.fn().mockResolvedValue(null);
        await (0, user_controller_1.login)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(errorHandler_1.default).toHaveBeenCalledWith('User does not exist', 400);
    });
    it('should throw error if password is wrong', async () => {
        const req = setupReq('', { email: 'test@user.com', password: 'wrongPassword' });
        const next = jest.fn();
        user_model_1.default.findOne = jest.fn().mockResolvedValue({ _id: 1, name: 'testUser', comparePassword: jest.fn().mockResolvedValue(false) });
        await (0, user_controller_1.login)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Invalid email or password', 400);
    });
    it('should login if the user exist', async () => {
        const req = setupReq('', { email: 'test@user.com', password: 'Password' });
        const next = jest.fn();
        user_model_1.default.findOne = jest
            .fn()
            .mockResolvedValue({
            _id: 1,
            name: "testUser",
            comparePassword: jest.fn().mockResolvedValue(true),
            signAccessToken: jest.fn().mockResolvedValue('token'),
            signRefreshToken: jest.fn().mockResolvedValue('refreshToken'),
        });
        const mockedSendToken = sendToken_1.sendToken;
        mockedSendToken.mockImplementation(async (user, status, res) => {
            res.status(status).json({
                accessToken: 'accessToken',
                user
            });
        });
        await (0, user_controller_1.login)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            accessToken: 'accessToken',
            user: expect.anything(),
        });
    });
});
describe('logout ', () => {
    const next = jest.fn();
    it('should delete refresh token ans return success message', async () => {
        const req = setupReq('', {}, { _id: 'userId' });
        redis_1.redis.del = jest.fn();
        await (0, user_controller_1.logout)(req, res, next);
        expect(res.cookie).toHaveBeenCalledWith('refreshToken', '', expect.any(Object));
        expect(redis_1.redis.del).toHaveBeenCalledWith('userId');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            message: 'Logout successful',
        });
    });
    it('should handle logout error', async () => {
        const req = setupReq('', {}, { _id: 'userId' });
        redis_1.redis.del = jest.fn().mockImplementation(() => { throw new Error('Error'); });
        await (0, user_controller_1.logout)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Error', 400);
    });
});
describe('userInfo', () => {
    const next = jest.fn();
    it('should return userInfo', async () => {
        const req = setupReq('', {}, { user: { _id: 'userId' } });
        await (0, user_controller_1.userInfo)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            data: req.user,
        });
    });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const user_model_1 = __importDefault(require("../../model/user.model"));
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const req_res_1 = require("../__mocks__/req_res");
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const sinon_1 = __importDefault(require("sinon"));
const redis_1 = require("../../utils/redis");
jest.mock('jsonwebtoken');
jest.mock('../../utils/errorHandler', () => {
    return jest.fn().mockImplementation((message, statusCode) => {
        return { message, statusCode };
    });
});
let redisGetStub;
let redisDelStub;
let jwtVerifyStub;
// Mock the userModel with the defined interface
jest.mock('../../model/user.model', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));
describe('Registration integration test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should register a new user successfully', async () => {
        const mockRequest = {
            body: {
                name: 'Test User',
                email: 'testuser@example.com',
            },
        };
        jsonwebtoken_1.default.sign.mockImplementation(() => 'valid.token.here');
        user_model_1.default.findOne.mockResolvedValue(null);
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/register')
            .send(mockRequest.body);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('token', 'valid.token.here');
    }, 5000);
    it('should return error is any function are missing', async () => {
        const mockRequest = {
            body: {
                name: 'Test User',
                email: '',
            },
        };
        user_model_1.default.findOne.mockResolvedValue(null);
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/register')
            .send(mockRequest.body);
        expect(response.status).toBe(400);
    });
});
describe('Validation account integration test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should check for missing params', async () => {
        const mockRequest = {
            body: {
                password: 'Test User',
                name: 'testuser@example.com',
                activationCode: '123456'
            },
            headers: {
                'content-type': 'application/json',
                authorization: 'Bearer 123456789',
            },
        };
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/validate')
            .send(mockRequest.body);
        expect(response.status).toBe(400);
    });
    it('should check for invalid authorization', async () => {
        const mockRequest = {
            body: {
                password: 'Test User',
                name: 'testuser@example.com',
                activationCode: '123456'
            },
            headers: {
                'content-type': 'application/json',
                authorization: 'invalid auth',
            },
        };
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/validate')
            .send(mockRequest.body);
        expect(response.status).toBe(400);
    });
    it('should check for invalid activation code', async () => {
        const mockRequest = {
            password: 'Test User',
            name: 'testuser@example.com',
            activationCode: '999999'
        };
        jsonwebtoken_1.default.verify.mockImplementation(() => ({
            email: 'test@example.com',
            activationCode: '123456',
        }));
        const mockAuthorizationHeader = 'Bearer valid.token.here';
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/validate')
            .set('authorization', mockAuthorizationHeader)
            .send(mockRequest);
        expect(response.status).toBe(400);
    });
    it('should fail with an invalid token', async () => {
        // Mock jwt.verify to throw an error
        jsonwebtoken_1.default.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });
        const mockRequestBody = {
            password: 'password123',
            name: 'Test User',
            activationCode: '123456',
        };
        const mockAuthorizationHeader = 'Bearer invalid.token.here';
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/validate')
            .set('authorization', mockAuthorizationHeader)
            .send(mockRequestBody);
        expect(response.status).toBe(400);
    });
    it('should validate the account successfully with a valid token', async () => {
        jsonwebtoken_1.default.verify.mockImplementation(() => ({
            email: 'test@example.com',
            activationCode: '123456',
        }));
        const mockRequestBody = {
            password: 'password123',
            name: 'Test User',
            activationCode: '123456',
        };
        const mockAuthorizationHeader = 'Bearer valid.token.here';
        user_model_1.default.findOne.mockResolvedValue({});
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/validate')
            .set('authorization', mockAuthorizationHeader)
            .send(mockRequestBody);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('message', 'Account validated');
    });
});
describe('Login integration test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should check for missing parameter', async () => {
        // jest.mock('./path/to/decrypt', () => ({
        //   decrypt: jest.fn().mockReturnValue(JSON.stringify({ email: 'user@gmail.com', password: 'password123' })),
        // }));
        const mockRequest = (0, req_res_1.setupReq)('', { email: 'user@gamil.com' });
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/login')
            .send(mockRequest.body);
        expect(response.status).toBe(400);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Please fill in all the fields', 400);
    });
    it('should be able to find the user and validate password', async () => {
        const mockRequest = (0, req_res_1.setupReq)('', { email: 'user@gmail.com', password: 'password123' });
        user_model_1.default.findOne.mockResolvedValue({
            _id: 1,
            name: 'testUser',
            comparePassword: jest.fn().mockResolvedValue(false)
        });
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/login')
            .send(mockRequest.body);
        expect(response.status).toBe(400);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Invalid email or password', 400);
    });
    it('should be able to login the user with correct credentials', async () => {
        const mockRequest = (0, req_res_1.setupReq)('', { email: 'user@gmail.com', password: 'password123' });
        user_model_1.default.findOne.mockResolvedValue({
            _id: 1,
            name: 'testUser',
            comparePassword: jest.fn().mockResolvedValue(true),
            signAccessToken: jest.fn().mockResolvedValue('token'),
            signRefreshToken: jest.fn().mockResolvedValue('refreshToken'),
        });
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/login')
            .send(mockRequest.body);
        expect(response.status).toBe(201);
    });
});
describe('logout integration test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        redisGetStub = sinon_1.default.stub(redis_1.redis, 'get');
        redisDelStub = sinon_1.default.stub(redis_1.redis, 'del');
        jwtVerifyStub = sinon_1.default.stub(jsonwebtoken_1.default, 'verify');
    });
    afterEach(() => {
        redisDelStub.restore();
        redisGetStub.restore();
        jwtVerifyStub.restore();
    });
    it('should be able to logout successfully', async () => {
        const mockRequest = (0, req_res_1.setupReq)('jwtToken', {});
        redisGetStub.resolves(JSON.stringify({
            _id: 1,
            name: 'testUser',
            email: 'test@example.com',
            password: 'password123',
        }));
        jwtVerifyStub.resolves({ _id: 1 });
        redisDelStub.resolves();
        const response = await (0, supertest_1.default)(app_1.app)
            .get('/api/v1/logout')
            .set('authorization', 'Bearer jwtToken')
            .send(mockRequest.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('message', 'Logout successful');
    });
    it('should return 403 if access token is invalid', async () => {
        jwtVerifyStub.resolves();
        const response = await (0, supertest_1.default)(app_1.app)
            .get('/api/v1/logout')
            .set('authorization', 'Bearer jwtToken');
        expect(response.status).toBe(403);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Invalid token', 403);
    });
    it('should return 403 if user not found in redis', async () => {
        jwtVerifyStub.returns({ _id: 'user123' });
        redisGetStub.resolves(null);
        const response = await (0, supertest_1.default)(app_1.app)
            .get('/api/v1/logout')
            .set('Authorization', 'Bearer your.jwt.token');
        expect(response.status).toBe(403);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Invalid token', 403);
    });
    it('should return 400 error if authorization not found', async () => {
        const response = await (0, supertest_1.default)(app_1.app)
            .get('/api/v1/logout');
        expect(response.status).toBe(400);
        expect(errorHandler_1.default).toHaveBeenCalledWith('Invalid authorization header', 400);
    });
});
describe('userInfo integratiom test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        redisGetStub = sinon_1.default.stub(redis_1.redis, 'get');
        jwtVerifyStub = sinon_1.default.stub(jsonwebtoken_1.default, 'verify');
    });
    afterEach(() => {
        redisDelStub.restore();
        redisGetStub.restore();
        jwtVerifyStub.restore();
    });
    const userInfo = {
        _id: 1,
        name: 'testUser',
        email: 'test@example.com',
    };
    it('should send userinfo', async () => {
        const mockRequest = (0, req_res_1.setupReq)('jwtToken', {});
        redisGetStub.resolves(JSON.stringify(userInfo));
        jwtVerifyStub.resolves({ _id: 1 });
        const response = await (0, supertest_1.default)(app_1.app)
            .get('/api/v1/me')
            .set('authorization', 'Bearer jwtToken')
            .send(mockRequest);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('name', userInfo.name);
        expect(response.body.data).toHaveProperty('email', userInfo.email);
    });
});

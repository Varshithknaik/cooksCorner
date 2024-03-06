"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { registration } from "../../controllers/user.controller";
const user_model_1 = __importDefault(require("../../model/user.model"));
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('jsonwebtoken');
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

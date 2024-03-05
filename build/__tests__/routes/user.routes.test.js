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
        user_model_1.default.findOne.mockResolvedValue(null);
        const response = await (0, supertest_1.default)(app_1.app)
            .post('/api/v1/register')
            .send(mockRequest.body);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('token');
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

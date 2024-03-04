"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const user_controller_1 = require("../../controllers/user.controller");
const user_model_1 = __importDefault(require("../../model/user.model"));
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
// Mock the userModel with the defined interface
jest.mock('../../model/user.model', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post('/register', user_controller_1.registration);
describe('Registration', () => {
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
        const response = await (0, supertest_1.default)(app)
            .post('/register')
            .send(mockRequest.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'success');
        expect(response.body).toHaveProperty('token');
    }, 5000);
});

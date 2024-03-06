"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_controller_1 = require("../../controllers/user.controller");
const user_model_1 = __importDefault(require("../../model/user.model"));
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
jest.mock('../../model/user.model');
jest.mock('../../utils/errorHandler');
describe('Registration user', () => {
    let req = {};
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
    const next = jest.fn();
    it('should return 201 and a token', async () => {
        req = {
            body: {
                name: 'testUser',
                email: 'test2@gmail.com',
            },
        };
        user_model_1.default.findOne = jest.fn().mockResolvedValue({});
        await (0, user_controller_1.registration)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            token: expect.any(String),
        });
    }, 50000);
    it('should throw error if parameter is empty', async () => {
        req = {
            body: {
                name: 'testUser',
                email: '',
            },
        };
        const next = jest.fn();
        const errorHandlerInstance = new errorHandler_1.default("User already exist", 409);
        next.mockImplementation((error) => {
            expect(error.message).toEqual(errorHandlerInstance.message);
            return error;
        });
        await (0, user_controller_1.registration)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });
    it('should throw error if user exist', async () => {
        req = {
            body: {
                name: 'testUser',
                email: 'test@user',
            },
        };
        const next = jest.fn();
        user_model_1.default.findOne = jest.fn().mockResolvedValue({ _id: 1, name: 'testUser' });
        const errorHandlerInstance = new errorHandler_1.default("User already exist", 409);
        next.mockImplementation((error) => {
            expect(error.message).toEqual(errorHandlerInstance.message);
            return error;
        });
        await (0, user_controller_1.registration)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });
});

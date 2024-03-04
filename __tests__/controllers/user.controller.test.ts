/* eslint-disable @typescript-eslint/no-explicit-any */
import { registration } from "../../controllers/user.controller";
import userModel from "../../model/user.model";
import request from 'supertest';
import express from 'express';

// Define an interface for the userModel
interface IUserModel {
 findOne: (filter: any) => Promise<any>;
 create: (user: any) => Promise<any>;
}

// Mock the userModel with the defined interface
jest.mock('../../model/user.model', () => ({
 findOne: jest.fn(),
 create: jest.fn(),
}) as unknown as IUserModel);

const app = express();
app.use(express.json());
app.post('/register', registration);

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

    (userModel.findOne as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post('/register')
      .send(mockRequest.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('token');
 }, 5000);

});

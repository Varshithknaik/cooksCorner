/* eslint-disable @typescript-eslint/no-explicit-any */
import userModel from "../../model/user.model";
import request from 'supertest';
import  {app}  from '../../app';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

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

    (jwt.sign as jest.Mock).mockImplementation(() => 'valid.token.here');
    (userModel.findOne as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post('/api/v1/register')
      .send(mockRequest.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('token' , 'valid.token.here');

 }, 5000);

 it('should return error is any function are missing', async() => {
  const mockRequest = {
    body: {
      name: 'Test User',
      email: '',
    },
  };

  (userModel.findOne as jest.Mock).mockResolvedValue(null);

  const response = await request(app)
    .post('/api/v1/register')
    .send(mockRequest.body);

  expect(response.status).toBe(400);
 })

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

    const response = await request(app)
      .post('/api/v1/validate')
      .send(mockRequest.body);

    expect(response.status).toBe(400);
  }) 

  it('should check for invalid authorization', async() => {
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

    const response = await request(app)
      .post('/api/v1/validate')
      .send(mockRequest.body);

    expect(response.status).toBe(400);
  })

  it('should check for invalid activation code', async() => {

    const mockRequest = {
      password: 'Test User',
      name: 'testuser@example.com',
      activationCode: '999999'
    };

    (jwt.verify as jest.Mock).mockImplementation(() => ({
      email: 'test@example.com',
      activationCode: '123456',
    }));
    const mockAuthorizationHeader = 'Bearer valid.token.here';
    const response = await request(app)
      .post('/api/v1/validate')
      .set('authorization' , mockAuthorizationHeader)
      .send(mockRequest);

    expect(response.status).toBe(400);
  })

  it('should fail with an invalid token', async () => {
    // Mock jwt.verify to throw an error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const mockRequestBody = {
      password: 'password123',
      name: 'Test User',
      activationCode: '123456',
    };
    const mockAuthorizationHeader = 'Bearer invalid.token.here';

    const response = await request(app)
      .post('/api/v1/validate')
      .set('authorization', mockAuthorizationHeader)
      .send(mockRequestBody);

    expect(response.status).toBe(400);
 });

 it('should validate the account successfully with a valid token', async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => ({
      email: 'test@example.com',
      activationCode: '123456',
    }));

    const mockRequestBody = {
      password: 'password123',
      name: 'Test User',
      activationCode: '123456',
    };
    const mockAuthorizationHeader = 'Bearer valid.token.here';
    (userModel.findOne as jest.Mock).mockResolvedValue({});
    const response = await request(app)
      .post('/api/v1/validate')
      .set('authorization', mockAuthorizationHeader)
      .send(mockRequestBody);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message', 'Account validated');
  });
})


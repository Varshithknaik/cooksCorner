/* eslint-disable @typescript-eslint/no-explicit-any */
import userModel from "../../model/user.model";
import request from 'supertest';
import  {app}  from '../../app';
import jwt from 'jsonwebtoken';
import { setupReq } from "../__mocks__/req_res";
import ErrorHandler from "../../utils/errorHandler";
import sinon from "sinon";
import { redis } from "../../utils/redis";

jest.mock('jsonwebtoken');
jest.mock('../../utils/errorHandler', () => {
  return jest.fn().mockImplementation((message: string, statusCode: number) => {
     return { message, statusCode };
  });
 });

 let redisGetStub: sinon.SinonStub;
 let redisDelStub: sinon.SinonStub;
 let jwtVerifyStub: sinon.SinonStub;

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

describe('Login integration test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check for missing parameter', async() => {
    // jest.mock('./path/to/decrypt', () => ({
    //   decrypt: jest.fn().mockReturnValue(JSON.stringify({ email: 'user@gmail.com', password: 'password123' })),
    // }));
    const mockRequest = setupReq('', {email: 'user@gamil.com'});
    const response = await request(app)
      .post('/api/v1/login')
      .send(mockRequest.body);

    expect(response.status).toBe(400);
    expect(ErrorHandler).toHaveBeenCalledWith('Please fill in all the fields', 400);
  })

  it('should be able to find the user and validate password', async() => {
    const mockRequest = setupReq('', { email: 'user@gmail.com', password: 'password123'});
    (userModel.findOne as jest.Mock).mockResolvedValue({
      _id: 1 ,
      name: 'testUser' ,
      comparePassword: jest.fn().mockResolvedValue(false)
    });
    const response = await request(app)
      .post('/api/v1/login')
      .send(mockRequest.body);

    expect(response.status).toBe(400);
    expect(ErrorHandler).toHaveBeenCalledWith('Invalid email or password', 400);
  });

  it('should be able to login the user with correct credentials', async() => {
    const mockRequest = setupReq('', { email: 'user@gmail.com', password: 'password123'});
    (userModel.findOne as jest.Mock).mockResolvedValue({
      _id: 1 ,
      name: 'testUser' ,
      comparePassword: jest.fn().mockResolvedValue(true),
      signAccessToken: jest.fn().mockResolvedValue('token'),
      signRefreshToken: jest.fn().mockResolvedValue('refreshToken'),
    });

    const response = await request(app)
      .post('/api/v1/login')
      .send(mockRequest.body);
    expect(response.status).toBe(201);
  })
});


describe('logout integration test', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    redisGetStub = sinon.stub(redis, 'get');
    redisDelStub = sinon.stub(redis, 'del');
    jwtVerifyStub = sinon.stub(jwt, 'verify');
  });

  afterEach(() => {
    redisDelStub.restore();
    redisGetStub.restore();
    jwtVerifyStub.restore();
  })

  it('should be able to logout successfully', async() => {
    const mockRequest = setupReq('jwtToken', {});
    redisGetStub.resolves(JSON.stringify({
      _id: 1,
      name: 'testUser',
      email: 'test@example.com',
      password: 'password123',
    }));
    jwtVerifyStub.resolves({ _id: 1 });
    redisDelStub.resolves();

    const response = await request(app)
      .get('/api/v1/logout')
      .set('authorization', 'Bearer jwtToken')
      .send(mockRequest.body);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message', 'Logout successful');
  });

  it('should return 403 if access token is invalid', async() => {
    jwtVerifyStub.resolves();
    const response = await request(app)
      .get('/api/v1/logout')
      .set('authorization', 'Bearer jwtToken')
    expect(response.status).toBe(403);
    expect(ErrorHandler).toHaveBeenCalledWith('Invalid token', 403);
  })

  it('should return 403 if user not found in redis', async() => {
    jwtVerifyStub.returns({ _id: 'user123' });
    redisGetStub.resolves(null);
    const response = await request(app)
      .get('/api/v1/logout')
      .set('Authorization', 'Bearer your.jwt.token');
    expect(response.status).toBe(403);
    expect(ErrorHandler).toHaveBeenCalledWith('Invalid token', 403);
  })

  it('should return 400 error if authorization not found', async() => {
    const response = await request(app)
      .get('/api/v1/logout');
    expect(response.status).toBe(400);
    expect(ErrorHandler).toHaveBeenCalledWith('Invalid authorization header', 400);
  })
});

describe('userInfo integratiom test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisGetStub = sinon.stub(redis, 'get');
    jwtVerifyStub = sinon.stub(jwt, 'verify');
  });

  afterEach(() => {
    redisDelStub.restore();
    redisGetStub.restore();
    jwtVerifyStub.restore();
  })

  const userInfo = {
    _id: 1,
    name: 'testUser',
    email: 'test@example.com',
  }

  it('should send userinfo', async () => {
    const mockRequest = setupReq('jwtToken', {});
    redisGetStub.resolves(JSON.stringify(userInfo));
    jwtVerifyStub.resolves({ _id: 1 });
    const response = await request(app)
      .get('/api/v1/me')
      .set('authorization', 'Bearer jwtToken')
      .send(mockRequest)
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('name', userInfo.name);
    expect(response.body.data).toHaveProperty('email', userInfo.email);
  })
})
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction , Response } from 'express';
import { login, logout, registration, userInfo, validateAccount } from '../../controllers/user.controller';
import userModel from '../../model/user.model';
import ErrorHandler from '../../utils/errorHandler';
import jwt from 'jsonwebtoken';
import { sendToken } from '../../utils/sendToken';
import { redis } from '../../utils/redis';

jest.mock('../../model/user.model');
jest.mock('../../utils/errorHandler', () => {
  return jest.fn().mockImplementation((message: string, statusCode: number) => {
     return { message, statusCode };
  });
 });
jest.mock('../../utils/sendToken');

const setupReq = ( authorization?: string , body: any = {} , user?: any ) => {
  return {
    body,
    headers: {
      authorization: `Bearer ${authorization}`,
    },
    user
  } as any;
}
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
} as unknown as Response;

describe('Registration user', () => {
  const next = jest.fn() as NextFunction;

  it('should return 201 and a token' , async () => {
    const req = setupReq( '' , {name: 'testUser' , email: 'test2@gmail.com'} )
    userModel.findOne = jest.fn().mockResolvedValue({});
    await registration(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      token: expect.any(String),
    });
  }, 50000);

  it('should throw error if parameter is empty', async () => {
    const req = setupReq( '' , {name: 'testUser' } )
    const next = jest.fn();
    await registration(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ErrorHandler).toHaveBeenCalledWith('Please fill in all the fields', 400);
  });

  it('should throw error if user exist', async() => {
    const req = {
      body: {
        name: 'testUser',
        email: 'test@user',
      },
    } as any;
    const next = jest.fn();
    userModel.findOne = jest.fn().mockResolvedValue({_id: 1 , name: 'testUser'});
    await registration(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ErrorHandler).toHaveBeenCalledWith('Email already exists', 400);
  })
})

describe('validateAccount ', () => {
  const next = jest.fn() as NextFunction;
  it('should be able to validate account', async () => {
    const req = setupReq('123456' , {
      name: 'testUser',
      password: 'password',
      activationCode: '123456',
    });
    jwt.verify =  jest.fn().mockReturnValue({ email: 'mockedEmail', activationCode: '123456' })
    userModel.create = jest.fn().mockResolvedValue({_id: 1 , name: 'testUser'});
    await validateAccount(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: 'Account validated',
    });
  })

  it('should throw error if parameter is empty', async () => {
    const req = setupReq('123456' , {
      name: 'testUser',
      password: 'password',
    });
    const next = jest.fn();

    await validateAccount(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  })

  it('should throw error if token is invalid', async() => {
    const req = setupReq('Bearer 123456' , {
      name: 'testUser',
      password: 'password',
      activationCode: '123456',
    });
    const next = jest.fn();
    jwt.verify =  jest.fn().mockImplementation(() => { throw new Error('Token invalid') })
    await validateAccount(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ErrorHandler).toHaveBeenCalledWith('Invalid authorization header', 400);
  })
    
})

describe('login', () => {
  it('should throw error if any parameter is missing', async() => {
    const req = setupReq('' , { email: 'test@user.com', password: '' });
    const next = jest.fn();
    await login(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ErrorHandler).toHaveBeenCalledWith('Please fill in all the fields', 400);
  });

  it('should throw error if user not exist', async() => {
    const req = setupReq('' , { email: 'test@user.com', password: 'password' });
    const next = jest.fn();
    userModel.findOne = jest.fn().mockResolvedValue(null);
    await login(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ErrorHandler).toHaveBeenCalledWith('User does not exist', 400);
  });

  it('should throw error if password is wrong', async() => {
    const req = setupReq('' , { email: 'test@user.com', password: 'wrongPassword' });
    const next = jest.fn();
    userModel.findOne = jest.fn().mockResolvedValue({_id: 1 , name: 'testUser' , comparePassword: jest.fn().mockResolvedValue(false) });
    await login(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ErrorHandler).toHaveBeenCalledWith('Invalid email or password', 400);
  });

  it('should login if the user exist', async() => {
    const req = setupReq('' , { email: 'test@user.com', password: 'Password' });
    const next = jest.fn();
    userModel.findOne = jest
      .fn()
      .mockResolvedValue({
        _id: 1,
        name: "testUser",
        comparePassword: jest.fn().mockResolvedValue(true),
        signAccessToken: jest.fn().mockResolvedValue('token'),
        signRefreshToken: jest.fn().mockResolvedValue('refreshToken'),
      });
    const mockedSendToken = sendToken as jest.Mock;
    mockedSendToken.mockImplementation(async (user, status, res) => {
      res.status(status).json({
        accessToken: 'accessToken',
        user
      });
    });
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: 'accessToken',
      user: expect.anything(),
    });
  })

})


describe('logout ', () => {
  const next = jest.fn();

  it('should delete refresh token ans return success message', async() => {
    const req = setupReq('', {} , { _id: 'userId'})
    redis.del = jest.fn();
    await logout(req , res , next);
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', '', expect.any(Object));
    expect(redis.del).toHaveBeenCalledWith('userId');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      message: 'Logout successful',
    });
  })

  it('should handle logout error', async() => {
    const req = setupReq('', {} ,  { _id: 'userId'});
    redis.del = jest.fn().mockImplementation(() => { throw new Error('Error') });
    await logout(req , res , next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ErrorHandler).toHaveBeenCalledWith('Error', 400);
  })
  
})

describe('userInfo' , () => {
  const next = jest.fn();
  it('should return userInfo', async () => {
    const req = setupReq('', {} , { user: { _id: 'userId'}});
    await userInfo(req , res , next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: req.user,
    });
  })


})

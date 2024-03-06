/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction , Response } from 'express';
import { registration, validateAccount } from '../../controllers/user.controller';
import userModel from '../../model/user.model';
import ErrorHandler from '../../utils/errorHandler';
import jwt from 'jsonwebtoken';

jest.mock('../../model/user.model');
jest.mock('../../utils/errorHandler');

describe('Registration user', () => {
  let req: any = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;

  it('should return 201 and a token' , async () => {
    req = {
      body: {
        name: 'testUser',
        email: 'test2@gmail.com',
      },
    } as any;
    userModel.findOne = jest.fn().mockResolvedValue({});
    await registration(req, res, next);

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
    } as any;
    const next = jest.fn();
    const errorHandlerInstance = new ErrorHandler("User already exist", 409);
    next.mockImplementation((error) => {
      expect(error.message).toEqual(errorHandlerInstance.message);
      return error;
    });
    await registration(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should throw error if user exist', async() => {
    req = {
      body: {
        name: 'testUser',
        email: 'test@user',
      },
    } as any;
    const next = jest.fn();
    userModel.findOne = jest.fn().mockResolvedValue({_id: 1 , name: 'testUser'});
    const errorHandlerInstance = new ErrorHandler("User already exist", 409);
    next.mockImplementation((error) => {
      expect(error.message).toEqual(errorHandlerInstance.message);
      return error;
    });
    await registration(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  })
})

describe('validateAccount ', () => {
  let req: any = {};
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;

  it('should be able to validate account', async () => {
    req = {
      body: {
        name: 'testUser',
        password: 'password',
        activationCode: '123456',
      },
      headers: {
        authorization: 'Bearer 123456',
      }
    } as any;
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
    req = {
      body: {
        name: 'testUser',
        password: '',
        activationCode: '',
      },
      headers: {
        authorization: 'Bearer 123456',
      }
    } as any;
    const next = jest.fn();
    const errorHandlerInstance = new ErrorHandler("User already exist", 409);
    next.mockImplementation((error) => {
      expect(error.message).toEqual(errorHandlerInstance.message);
      return error;
    });
    await validateAccount(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  })

  it('should throw error if token is invalid', async() => {
    req = {
      body: {
        name: 'testUser',
        password: 'password',
        activationCode: '123456',
      },
      headers: {
        authorization: 'Bearer 1234567',
      }
    } as any;
    const next = jest.fn();
    jwt.verify =  jest.fn().mockImplementation(() => { throw new Error('Token invalid') })
    const errorHandlerInstance = new ErrorHandler("Token invalid", 401);
    next.mockImplementation((error) => {
      expect(error.message).toEqual(errorHandlerInstance.message);
      return error;
    });
    await validateAccount(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  })
    
})

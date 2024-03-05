/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction , Response } from 'express';
import { registration } from '../../controllers/user.controller';
import userModel from '../../model/user.model';
import ErrorHandler from '../../utils/errorHandler';

jest.mock('../../model/user.model');
jest.mock('../../utils/errorHandler')


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
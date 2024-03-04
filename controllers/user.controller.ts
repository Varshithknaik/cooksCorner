/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import ErrorHandler from '../utils/errorHandler';
import { Request, Response, NextFunction } from 'express';
import userModel from '../model/user.model';
import jwt from 'jsonwebtoken';
import { encrypt } from '../utils/encryption';
import sendMail from '../utils/sendMail';
dotenv.config();

type IRegistrationBody = {
  name: string;
  email: string;
  password: string;
}

export const registration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body as IRegistrationBody;
    validateInput(name, email, password);
    await checkIfEmailExists(email);
    const encryptedPassword = encrypt(password);
    const activationToken = generateActivationToken(name, email, encryptedPassword);
    const activationCode = generateActivationCode();
    await sendActivationEmail(email, name, activationCode);
    sendResponse(res, activationToken);
  } catch (error: unknown) {
    handleRegistrationError(error, next);
  }
}

const validateInput = (name: string, email: string, password: string) => {
  if (!name || !email || !password) {
    throw new ErrorHandler('Please fill in all the fields', 400);
  }
}

const checkIfEmailExists = async (email: string) => {
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    throw new ErrorHandler('Email already exists', 400);
  }
}

const generateActivationToken = (name: string, email: string, password: string) => {
  const payload = { name, email, password };
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret', { expiresIn: '1h' });
}

const generateActivationCode = () => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  return activationCode ;
}

const sendActivationEmail = async (email: string, name: string, activationCode: string) => {
  const data = { name, activationCode };
  await sendMail({
    email,
    subject: 'Account Activation',
    template: 'activation-mail.ejs',
    data
  });
}

const sendResponse = (res: Response, activationToken: string) => {
  res.status(200).json({
    status: 'success',
    token: activationToken
  });
}

const handleRegistrationError = (error: any, next: NextFunction) => {
  return next(new ErrorHandler(error.message, 400));
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import ErrorHandler from '../utils/errorHandler';
import { Request, Response, NextFunction } from 'express';
import userModel from '../model/user.model';
import jwt from 'jsonwebtoken';
import sendMail from '../utils/sendMail';
dotenv.config();

type IRegistrationBody = {
  name: string;
  email: string;
  password: string;
}

export const registration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name , email } = req.body as IRegistrationBody;
    validateInput( name, email);
    await checkIfEmailExists(email);
    const activationToken = generateActivationToken( email );
    const activationCode = generateActivationCode();
    await sendActivationEmail(email, name, activationCode);
    res.status(201).json({
      message: 'Registration successful',
      data: {
        activationToken,
        activationCode
      }
    });
  } catch (error: any) {
    handleRegistrationError(error, next);
  }
}

const validateInput = (name: string, email: string) => {
  if (!name || !email) {
     throw handleError('Please fill in all the fields', 400);
  }
 }

const checkIfEmailExists = async (email: string) => {
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    throw handleError('Email already exists', 400);
  }
}

const generateActivationToken = ( email: string) => {
  const payload = { email};
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret', { expiresIn: '1h' });
}

const generateActivationCode = () => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  return activationCode;
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


const handleRegistrationError = (error: any, next: NextFunction) => {
  return next(handleError(error.message, 400));
}

const handleError = ( message:string , status:number) => {
  return new ErrorHandler(message, status);
}
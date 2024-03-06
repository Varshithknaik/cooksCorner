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
    const activationCode = generateActivationCode();
    const activationToken = generateActivationToken( email , activationCode );
    await sendActivationEmail(email, name, activationCode);
    res.status(201).json({
      status: 'success',
      token: activationToken
    });
  } catch (error: any) {
    handleTryCatchError(error, next);
  }
}

export const validateInput = (...args: string[]) => {
  if(args.some( args => !args)){
    throw handleError('Please fill in all the fields', 400);
  }
 }

export const checkIfEmailExists = async (email: string) => {
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist && Object.keys(isEmailExist).length !== 0) {
    throw handleError('Email already exists', 400);
  }
}

export const generateActivationToken = ( email: string , activationCode: string ) => {
  const payload = { email , activationCode };
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret', { expiresIn: '1h' });
}

export const generateActivationCode = () => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  return activationCode;
}

export const sendActivationEmail = async (email: string, name: string, activationCode: string) => {
  const data = { name, activationCode };
  await sendMail({
    email,
    subject: 'Account Activation',
    template: 'activation-mail.ejs',
    data
  });
}

export const handleTryCatchError = (error: any, next: NextFunction) => {
  return next(handleError(error.message, 400));
}

export const handleError = ( message:string , status:number) => {
  return new ErrorHandler(message, status);
}

export const authorizationValidation = (auth:string[]) => {

  if(auth.length !== 2 || !auth[0].startsWith('Bearer')){
    throw handleError('Invalid authorization header', 400);
  }
  return auth[1]
}

export const validateAccount = async ( req:Request , res:Response , next:NextFunction) => {
  try{
    const { password , name , activationCode } = req.body;
    const authorizationHeader = req.headers.authorization ?? '';
    const auth = authorizationValidation(authorizationHeader.split(' '));
    
    validateInput( password , name , activationCode);
    
    const { email , activationCode : code} = jwt.verify( auth , process.env.ACTIVATION_TOKEN_SECRET ?? 'secret') as { email: string , activationCode: string };

    if(activationCode !== code){
      throw handleError('Invalid activation code', 400);
    }

    await userModel.create({ name , email , password });

    res.status(201).json({
      status: 'success',
      message: 'Account validated'
    });
    
  }catch(error){
    handleTryCatchError(error , next);
  }
}

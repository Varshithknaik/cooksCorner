/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import userModel from '../model/user.model';
import jwt from 'jsonwebtoken';
import sendMail from '../utils/sendMail';
import { authorizationValidation, handleError, handleTryCatchError } from '../utils/utilFunction';
import { sendToken } from '../utils/sendToken';
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

export const login = async ( req:Request , res: Response , next: NextFunction ) => {
  try{
    const { email , password } = req.body;
    validateInput( email , password );
    const user = await userModel.findOne({ email });
    if(!user){
      throw handleError('Invalid email or password', 400);
    }
    const isPasswordValid = await user.comparePassword(password);
    if(!isPasswordValid){
      throw handleError('Invalid email or password', 400);
    }

    sendToken(user , 201 , res)
  }catch(error){
    handleTryCatchError(error , next);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import userModel from '../model/user.model';
import jwt from 'jsonwebtoken';
import sendMail from '../utils/sendMail';
import { authorizationValidation, handleError, handleTryCatchError } from '../utils/utilFunction';
import { refreshTokenCookieOptions, sendToken } from '../utils/sendToken';
import { redis } from '../utils/redis';
import { decrypt, encrypt } from '../utils/encryption';
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
    const payload = { email , activationCode};
    const activationToken = generateActivationToken( payload , '1h' );
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

export const generateActivationToken = ( payload: {[key:string] : string } , expiration:string ) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET ?? 'secret', { expiresIn: expiration });
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
    console.log( decrypt( req.body.data) )
    const { email , password } = req.body;
    validateInput( email , password );
    const user = await userModel.findOne({ email });
    if(!user){
      throw handleError('User does not exist', 400);
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

export const logout = async(req: Request , res: Response , next: NextFunction) => {
  try {
    res.cookie('refreshToken', '' , { maxAge: 1});
    const userId = req.user?._id ?? '';
    await redis.del(userId);
    res.status(200).json({
      status: 'success',
      message: 'Logout successful'
    });

  } catch (error) {
    handleTryCatchError(error, next);
  }
}

export const userInfo = async( req: Request , res:Response , next:NextFunction ) => {
  const encryptedBody = encrypt( JSON.stringify(req.user) )
  try {
    res.status(200).json({
      status: 'success',
      data: encryptedBody
    });
  } catch (error) {
    handleTryCatchError(error, next);
  }
}

export const refresh = async( req: Request , res: Response , next:NextFunction) => {
  try{
    const token = req.cookies.refreshToken;

    const decoded = await jwt.sign( token , process.env.REFRESH_TOKEN_SECRET ?? 'secret') as unknown as { _id: string};
    if(!decoded){
      next(handleError('Could not refresh the token', 401))
    }

    const session = await redis.get(decoded?._id);

    if(!session){
      next(handleError('Session expired please login again', 401))
    }

    const user = JSON.parse(session as string);

    const refreshToken = await generateActivationToken({ _id: user._id } , '7d');
    const accessToken = await generateActivationToken({ _id: user._id } , '5m');
    await redis.set(user._id, JSON.stringify(user), 'EX', 60 * 60 * 24 * 7);
    res.cookie('refreshToken', refreshToken , refreshTokenCookieOptions);

    res.status(200).json({
      status: 'success',
      accessToken
    });
  }catch(error){
    handleTryCatchError(error, next);
  }
}

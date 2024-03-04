/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import ErrorHandler from '../utils/errorHandler';
import { Request, Response, NextFunction } from 'express';
import userModel from '../model/user.model';
import jwt from 'jsonwebtoken';
import { encrypt } from '../utils/encryption';
import sendMail from '../utils/sendMail';

dotenv.config();

// Define the shape of the registration request body
type IRegistationBody = {
 name: string;
 email: string;
 password: string;
};

// Registration handler
export const registration = async (
 req: Request,
 res: Response,
 next: NextFunction
) => {
 try {
    const { name, email, password } = req.body as IRegistationBody;

    // Validate input fields
    if (!name || !email || !password) {
      return next(new ErrorHandler('please fill all the fields', 400));
    }

    // Check if email already exists
    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist) {
      return next(new ErrorHandler('email already exist', 400));
    }

    // Encrypt password
    const encrypedPassword = encrypt(password);

    // Prepare payload for JWT
    const payload = {
      name,
      email,
      password: encrypedPassword,
    };

    // Generate and sign JWT
    const activationToken = jwt.sign(
      payload,
      process.env.ACTIVATION_TOKEN_SECRET ?? 'secret',
      { expiresIn: '1h' }
    );

    // Generate activation code
    const { activationCode } = tokenGenerator();

    // Prepare data for email
    const data = {
      name,
      activationCode,
    };

    // Send activation email
    await sendMail({
      email,
      subject: 'Account Activation',
      template: 'activation-mail.ejs',
      data,
    });

    // Send success response
    res.status(200).json({
      status: 'success',
      token: activationToken,
    });
 } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
 }
};

// Function to generate activation code
const tokenGenerator = () => {
 const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
 return { activationCode };
};

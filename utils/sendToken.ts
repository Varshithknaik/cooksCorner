/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { IUser } from "../model/user.model";
import { redis } from "./redis";
import { encrypt } from "./encryption";

interface ICookie{
  maxAge: number;
  httpOnly: boolean;
  sameSite: any;
  secure: boolean;
}

export const refreshTokenCookieOptions: ICookie = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  httpOnly: true,
  sameSite: "none",
  secure: true
}
export const sendToken = async (user: IUser , status:number , res: Response ) => {
  const accessToken = user.signAccessToken();
  const refreshToken = user.signRefreshToken();
  res.cookie('refreshToken' , refreshToken , refreshTokenCookieOptions)
  await redis.set(user._id , JSON.stringify(user) , "EX" , 7 * 24 * 60 * 60)
  const encryptedBody = encrypt(JSON.stringify({
      accessToken,
      user
    }))
  res.status(status).json({ status: 'success' , data: encryptedBody})
}
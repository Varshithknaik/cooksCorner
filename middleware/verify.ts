/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Response , Request } from "express";
import { authorizationValidation, handleError, handleTryCatchError } from "../utils/utilFunction";
import jwt from 'jsonwebtoken';
import { redis } from "../utils/redis";

export const verify = async ( req:Request , res: Response , next: NextFunction) => {
  try {
    const authorization = req.headers.authorization ?? '';
    if(!authorization){
      next(handleError('Invalid token', 403))
    }
    const auth = authorizationValidation(authorization.split(' '));

    const decoded = await jwt.verify( auth , process.env.ACCESS_TOKEN_SECRET!  ) as { id: string };
    if(!decoded){
      next(handleError('Invalid token', 403))
    }

    const user = await redis.get(decoded.id) ?? '';
    if(!user){
      next(handleError('Invalid token', 403))
    }

    req.user = JSON.parse( user );
    next();

  } catch (error:any) {
    handleTryCatchError(error.message , next)
  }

} 
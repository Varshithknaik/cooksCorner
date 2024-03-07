/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction } from "express";
import ErrorHandler from "./errorHandler";

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
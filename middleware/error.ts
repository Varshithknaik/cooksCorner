/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request , Response  } from "express";
import ErrorHandler from "../utils/errorHandler";

export const ErrorMiddleware = ( err:any , req:Request , res:Response) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong MongoDB id error
  if(err.name === "CastError"){
    const message = `Resource not found. Invalid ${err.path}`;
    err = new ErrorHandler(message , 404);
  }

  //Duplicate Error
  if(err.code === 11000){
    const message = `Resource already exists. ${err.errmsg}`;
    err = new ErrorHandler(message , 409);
  }

  // Invalid JWT token
  if(err.name === "JsonWebTokenError"){
    const message = "Invalid JWT token";
    err = new ErrorHandler(message , 400);
  }

  // Jwt Expiration
  if (err.name === "TokenExpiredError") {
    const message = "Json Wen Token is Expired, try again";
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
}
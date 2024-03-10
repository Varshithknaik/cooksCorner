import express from 'express'
import { login, logout, refresh, registration, userInfo, validateAccount } from '../controllers/user.controller';
import { catchAsyncError } from '../middleware/catchAsyncError';
import { verify } from '../middleware/verify';

const userRouter = express.Router()

userRouter.post('/register', catchAsyncError(registration))

userRouter.post('/validate', catchAsyncError(validateAccount));

userRouter.post('/login', catchAsyncError(login));

userRouter.get('/logout' , catchAsyncError(verify), catchAsyncError(logout));

userRouter.get('/me', catchAsyncError(verify), catchAsyncError(userInfo));

userRouter.get('/refresh', catchAsyncError(refresh))

export default userRouter;
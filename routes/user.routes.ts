import express from 'express'
import { registration, validateAccount } from '../controllers/user.controller';
import { catchAsyncError } from '../middleware/catchAsyncError';

const userRouter = express.Router()

userRouter.post('/register', catchAsyncError(registration))

userRouter.post('/validate', catchAsyncError(validateAccount))

export default userRouter;
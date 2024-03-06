import express from 'express'
import { registration } from '../controllers/user.controller';
import { catchAsyncError } from '../middleware/catchAsyncError';

const userRouter = express.Router()

userRouter.post('/register', catchAsyncError(registration))

export default userRouter;
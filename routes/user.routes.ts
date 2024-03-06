import express from 'express'
import { registration } from '../controllers/user.controller';

const userRouter = express.Router()

userRouter.post('/register', registration)

export default userRouter;
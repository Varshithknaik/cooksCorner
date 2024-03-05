import express, { Request , Response } from 'express';

export const app = express();
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from "express-rate-limit";
import { ErrorMiddleware } from './middleware/error';
import userRouter from './routes/user.routes';

//body-parsers
app.use(express.json({ limit: '50mb'}));

// cookie-parser
app.use(cookieParser())

app.use(cors({
  origin: ['http://localhost:3000' , 'https://cookscorner-client.onrender.com/']
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later'
  },
})

app.use('/api/v1' , userRouter)

app.get('/test' , (req:Request , res:Response) => {
  res.status(200).json({
    success: true,
    message: "API is Working Fine"
  })
})

app.all('*', ( req: Request , res: Response ) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

app.use(limiter);

app.use(ErrorMiddleware);


import { app } from './app';
import connectDb from './utils/db';
import dotenv from "dotenv"

dotenv.config();


app.listen(process.env.PORT || 3001, () => {
  console.log(`Server is running on port ${process.env.PORT}`)
  connectDb();
})
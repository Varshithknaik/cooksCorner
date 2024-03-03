import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DB_URL ?? '';

const connectDb = async () => {
  try {
    await mongoose.connect(dbUrl , {}).then(( data ) => {
      console.log(`Database connected with ${data.connection.host}`)
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log( error.message);
    setTimeout( () => {
      connectDb()
    }, 5000 )
  }
};

export default connectDb;
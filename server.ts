import { app } from './app';
import connectDb from './utils/db';

require("dotenv").config();

const PORT = process.env.PORT ?? 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDb()
    .then(() => {
      console.log('Database connected');
    })
    .catch((err) => {
      console.log(err);
    });
});
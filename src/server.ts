import 'dotenv/config';
import http from 'http';
import app from './app';
import connectDB from './config/connect';
import { initSocket } from './services/socket/socket';

const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await connectDB();
    initSocket(server);
  } catch (err) {
    console.log('Unable to connect to DB', err);
  }
  server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
};

start();

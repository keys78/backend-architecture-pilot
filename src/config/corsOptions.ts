import { CorsOptions } from 'cors';
import allowedOrigins from './allowedOrigins';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    console.log('Request from:', origin);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS error: not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsOptions;

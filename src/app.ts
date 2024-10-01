import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import corsOptions from './config/corsOptions';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import createHttpError from 'http-errors';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import Redis from 'ioredis';
import RedisStore from 'connect-redis';

//Initializing Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  console.error('Redis error: ', err);
});

// Correctly instantiate RedisStore
const redisStore = new RedisStore({
  client: redisClient,
});

const app = express();

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    store: redisStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'none',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) =>
  res.json({ success: true, message: 'stuthera api is running!' })
);

app.use('/', routes);

app.use((req, res, next) => {
  next(createHttpError(404, 'Endpoint not found korokoro'));
});

app.use(errorHandler);

export default app;

// import express from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import bodyParser from 'body-parser';
// import helmet from 'helmet';
// import corsOptions from './config/corsOptions';
// import { errorHandler } from './middleware/errorHandler';
// import routes from './routes';
// import createHttpError from 'http-errors';
// import passport from 'passport';
// import session from 'express-session';
// import cookieParser from 'cookie-parser'
// import './config/passport'

// // require('express-async-errors');

// const app = express();

// app.set('trust proxy', 1);
// app.use(cookieParser());
// app.use(express.json());
// app.use(cors(corsOptions));
// app.use(morgan('combined'));
// app.use(helmet());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded({ extended: true }));

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET!,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: true }, // Set to true in production
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// //touch-down
// app.get('/', (req, res) =>
//   res.json({ success: true, message: 'stuthera api is running!' })
// );

// app.use('/', routes);

// app.use((req, res, next) => {
//   next(createHttpError(404, 'Endpoint not found korokoro'));
// });

// app.use(errorHandler);

// export default app;

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logEvents } from './logger';

const rateLimiterOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login requests per window
  message: {
    message:
      'Too many login attempts from this IP, please try again after a 60 second pause',
  },
  handler: (req: Request, res: Response, next: NextFunction) => {
    logEvents(
      `Too Many Requests: ${rateLimiterOptions.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      'errLog.log'
    );
    res.status(429).send(rateLimiterOptions.message); // Send a 429 status code
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

const loginLimiter = rateLimit(rateLimiterOptions);

export default loginLimiter;

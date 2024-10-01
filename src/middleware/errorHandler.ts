import { Request, Response, NextFunction } from 'express';

class HttpError extends Error {
  statusCode: number;
  message: string;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

export const errorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error(err.stack);
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new HttpError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

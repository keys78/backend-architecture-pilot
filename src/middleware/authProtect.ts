import { Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import UserModel from '../models/user.model';
import { AuthRequest } from '../utils/helpers';

export const authorizedUser: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer')) {
    return next(createHttpError(401, 'Unauthorized'));
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as JwtPayload;

    if (!decoded || !decoded.userId) {
      return next(createHttpError(401, 'Invalid token payload'));
    }

    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return next(createHttpError(401, 'No user found with this id'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(createHttpError(401, 'Token expired'));
    }
    return next(createHttpError(403, 'Unauthorized User'));
  }
};


//   let token: string;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   } else {
//     return next(createHttpError(401, 'Access token is missing'));
//   }

import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload | IUser;
    }
  }
}
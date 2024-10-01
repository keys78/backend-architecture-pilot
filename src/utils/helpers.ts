export function getRandomInt() {
  const min = Math.ceil(100000);
  const max = Math.floor(999999);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

export const extractPublicIdFromImageUrl = (imageUrl: string) => {
  const segments = imageUrl.split('/');
  const publicId = segments.slice(-2).join('/');
  return publicId.substring(0, publicId.lastIndexOf('.'));
};



import { Request } from 'express';
// import { JwtPayload } from 'jsonwebtoken';
// import { IUser } from '../models/user.model';
export interface AuthRequest extends Request {
  user?: any
}
// export interface AuthRequest extends Request {
//   user?: IUser | JwtPayload
// }
// const userId = typeof req.user === 'string' ? req.user : req.user?.id;


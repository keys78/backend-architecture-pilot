import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import UserModel from '../models/user.model';
import TokenModel from '../models/token.model';
import createHttpError from 'http-errors';
import crypto from 'crypto';
import sendEmail from '../services/mail-service/emailService';
import { getRandomInt } from '../utils/helpers';
import mongoose from 'mongoose';



export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    switch (true) {
      case !firstName:
        throw createHttpError(400, 'First name is required');
      case !lastName:
        throw createHttpError(400, 'Last name is required');
      case !email:
        throw createHttpError(400, 'Email is required');
      case !password:
        throw createHttpError(400, 'Password is required');
      default:
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
          throw createHttpError(401, 'Account already exists, try logging in');
        }

        const user = new UserModel({
          firstName,
          lastName,
          email,
          password,
          onboardingInfo: {
            onboarded:false
          },
          dailyGoals: {}
        });

        await user.save();

        const token = await generateVerificationToken(
          user._id as mongoose.Types.ObjectId
        );

        const message = `Here is your verification code, expires in 10 minutes: ${token}`;
        console.log('myyyyyyyyytoken', token)

        // await sendEmail({
        //   to: user.email,
        //   subject: 'Email Verification',
        //   text: message,
        // });

        res.status(201).json({
          success: true,
          message: `Hi ${user.firstName}, we sent you a code, enter it to verify ${user.email}.`,
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
          },
        });
        break;
    }
  } catch (error) {
    next(error);
  }
};

export const resendCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email }).exec();

    if (!user) {
      throw createHttpError(401, 'Invalid user');
    }

    if (!user.isVerified) {
      let verificationToken = await TokenModel.findOne({
        userId: user._id,
      }).exec();

      if (verificationToken) {
        await TokenModel.findByIdAndDelete(verificationToken._id).exec();
      }

      const token = await generateVerificationToken(
        user._id as mongoose.Types.ObjectId
      );

       const message = `Here is your verification code, expires in 10 minutes: ${token}`;
       console.log('myyyyyyyyytoken', token);

      await sendEmail({
        to: user.email,
        subject: 'Email Verification',
        text: message,
      });

      res.json({
        success: true,
        message: 'Verification code sent, check your mailbox',
      });
      return;
    }

    throw createHttpError(400, 'User is already verified');
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).send({ message: 'Email and token are required' });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: 'User does not exist' });
    }

    const verificationToken = await TokenModel.findOne({ userId: user._id });
    if (!verificationToken) {
      return res.status(400).send({ message: 'Invalid or expired token' });
    }

    const isTokenValid = await bcrypt.compare(token, verificationToken.token);
    if (!isTokenValid || verificationToken.expiresAt < new Date()) {
      return res.status(400).send({ message: 'Invalid or expired token' });
    }

    user.isVerified = true;
    await user.save();
    await TokenModel.deleteOne({ _id: verificationToken._id });

    const accessToken = generateAccessToken(user._id as string);
    const refreshToken = generateRefreshToken(user._id as string);

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', //I can later change to strict if I am hosting on same network place
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    res.json({
      success: true,
      message: 'Account verification successful',
      accessToken,
      redirectTo: user.onboardingInfo.onboarded ? '/dashboard' : '/onboarding',
    });

  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email }).exec();
    if (!user) {
      throw createHttpError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid email or password');
    }

    if (!user.isVerified) {
      await TokenModel.deleteMany({ userId: user._id });

      const token = await generateVerificationToken(
        user._id as mongoose.Types.ObjectId
      );

      console.log('mytojkeennn', token);

      // await sendEmail({
      //   to: user.email,
      //   subject: 'Email Verification',
      //   text: `Your verification code is: ${token}`,
      // });

      return res.json({
        success: false,
        message: `Account not verified. We sent you a code, if you own this account enter it to verify ${user.email}`,
        user: { _id: user._id, email: user.email },
      });
    }

    const accessToken = generateAccessToken(user._id as string);
    const refreshToken = generateRefreshToken(user._id as string);

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });

    return res.json({
      success: true,
      accessToken,
      redirectTo: user.onboardingInfo.onboarded ? '/dashboard' : '/onboarding',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) throw createHttpError(400, 'Email is required');

    const user = await UserModel.findOne({ email });
    if (!user) throw createHttpError(404, 'User not found');

    const verificationCode = getRandomInt().toString();
    const hash = crypto
      .createHash('sha256')
      .update(verificationCode)
      .digest('hex');

    console.log('verifgfffff', verificationCode)
    user.resetPasswordToken = hash;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();
    

    // Send verificationCode via email
    //  await sendEmail({
    //   to: email,
    //   subject: 'Password Reset',
    //   text: `Here is code to reset your password: ${verificationCode}, this code expires in 5 minuites`,
    // });

    console.log('elocode', verificationCode);

    res.status(200).json({
      success: true,
      user: {
        email: user.email,
      },
      message: `We sent you a code to reset your password, enter it to verify ${user.email}`,
    });
  } catch (error) {
    next(error);
  }
};

export const validateVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      throw createHttpError(400, 'Email and verification code are required');

    const user = await UserModel.findOne({ email });
    if (!user) throw createHttpError(404, 'User not found');

    const hash = crypto.createHash('sha256').update(code).digest('hex');

    if (
      user.resetPasswordToken !== hash ||
      (user.resetPasswordExpires as any) < new Date()
    ) {
      throw createHttpError(400, 'Invalid or expired verification code');
    }

    const resetToken = hash;

    res.status(200).json({
      success: true,
      redirectUrl: `/auth/reset-password/${user._id}/${resetToken}`,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      throw createHttpError(400, 'Reset token and new password are required');
    }

    const user = await UserModel.findOne({ resetPasswordToken: resetToken });
    if (!user) throw createHttpError(404, 'Invalid token / User not found');

    if ((user.resetPasswordExpires as any) < new Date()) {
      throw createHttpError(400, 'Reset token has expired');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Hi, ${user.firstName}, your password reset was successful, you can now login`,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(204); //no content

  // If the token is present, proceed to clear the refresh token cookie, 
  // but might rename jwt to refreshToken for consistecny
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.json({
    success: true,
    message: 'Logout successful',
  });
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized.' });

  const refreshToken = cookies.jwt;

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as JwtPayload;
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw createHttpError(401, 'User not found');
    }
    const accessToken = generateAccessToken(user._id as string);
    res.json({ accessToken });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(403).json({ message: 'Forbidden' });
  }
};

const generateVerificationToken = async (userId: mongoose.Types.ObjectId) => {
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedToken = await bcrypt.hash(token, 10);

  await new TokenModel({
    userId,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiration
  }).save();

  return token;
};

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '7d',
  });
};

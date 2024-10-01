import express from 'express';
import * as authController from '../controllers/auth.controller';
import validate from '../middleware/validate';
import { loginSchema, signupSchema, verifyEmailSchema } from '../utils/validators';
import passport from 'passport';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../controllers/auth.controller';
import loginLimiter from '../middleware/loginLimiter';

const router = express.Router();

//email signup and login
router.post('/signup', validate(signupSchema), authController.signup);

router.post('/verify-account', validate(verifyEmailSchema), authController.verifyEmail);

router.post('/resend-code', authController.resendCode);

router.post('/login', loginLimiter, validate(loginSchema), authController.login);

router.post('/forgot-password', authController.forgotPassword);

router.post('/validate-code', authController.validateVerificationCode); //this is for reset password flow

router.post('/reset-password', authController.resetPassword);

router.get('/refresh', authController.refreshToken);

router.post('/logout', authController.logout);



//google signing and login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    successRedirect: process.env.FRONTEND_BASE_URL + '/dashboard',
    failureRedirect: process.env.FRONTEND_BASE_URL + '/auth/login'
  }
))
// router.get(
//   '/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   (req, res) => {
//     const user = req.user as any;
//     const accessToken = generateAccessToken(user._id.toString());
//     const refreshToken = generateRefreshToken(user._id.toString());

//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
//     });

//     res.redirect(`/auth/success?accessToken=${accessToken}`);
//   }
// );

export default router;
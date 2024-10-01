import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import UserModel, { IUser } from '../models/user.model';
import { Document } from 'mongoose';

interface ICustomUser extends IUser {
  _id: string;
}

// Using GoogleStrategy from passport-google-oauth20
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.API_BASE_URL}/v1.0/auth/google/callback`,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      console.log('profile', profile);
      try {
        let user = await UserModel.findOne({ googleId: profile.id });

        if (!user) {
          user = new UserModel({
            googleId: profile.id,
            firstName: profile.name?.givenName || 'nofirstname',
            lastName: profile.name?.familyName || 'nolastname',
            email: profile.emails?.[0].value,
            profileImage: profile.photos?.[0].value,
            provider: 'google',
            isVerified: true,
          });
          await user.save();
        }

        done(null, user as ICustomUser);
      } catch (error) {
        done(error);
      }
    }
  )
);

  passport.serializeUser(function (
    user: Express.User,
    done: (err: any, id?: string) => void
  ) {
    const userId = (user as IUser)._id?.toString();
    if (userId) {
      done(null, userId);
    } else {
      done(new Error('User ID not found'));
    }
  });

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = (await UserModel.findById(id)) as ICustomUser | null;
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

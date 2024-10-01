import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import _ from 'lodash';

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER = 'super',
}

export interface IUser extends Document {
  googleId?: string;
  provider: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dob?: Date;
  profileImage?: string;
  communityInfo: {
    joined: boolean;
    author: string;
    bio: string;
  };
  onboardingInfo: {
    onboarded: boolean;
    why: string;
    stutterGrade: string;
    reminder: string;
  };
  dailyGoals: {
    mindfulness: Number;
    warmUp: Number;
    games: Number;
    scriptActing: Number;
    reading: Number;
  };
  displayName?: string;
  bio?: string;
  role: UserRole;
  isVerified: boolean;
  isDeletedUser: boolean;
  savedAffirmations: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  matchPasswords: (password: string) => Promise<boolean>;
}

const CommunityInfoSchema: Schema = new Schema(
  {
    joined: { type: Boolean, required: true, default: false },
    author: { type: String, required: true },
    bio: { type: String },
  },
  { timestamps: true }
);

const OnboardingSchema: Schema = new Schema(
  {
    onboarded: { type: Boolean, required: true, default: false },
    why: { type: String },
    stutterGrade: { type: String },
    reminder: { type: String },
  },
  { timestamps: true }
);

const DailyGoalsSchema: Schema = new Schema(
  {
    mindfulness: { type: Number, default: 0 },
    warmUp: { type: Number, default: 0 },
    games: { type: Number, default: 0 },
    scriptActing: { type: Number, default: 0 },
    reading: { type: Number, default: 0 },
  },
  { _id: false }
);



const UserSchema: Schema<IUser> = new Schema({
  googleId: { type: String, unique: true, sparse: true },
  provider: { type: String, default: 'email' },
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  dob: { type: String },
  profileImage: { type: String, default: '' },
  role: { type: String, enum: UserRole, default: UserRole.USER },
  isVerified: { type: Boolean, default: false },
  isDeletedUser: { type: Boolean, default: false },
  onboardingInfo: { type: OnboardingSchema },
  communityInfo: { type: CommunityInfoSchema },
  dailyGoals: { type: DailyGoalsSchema },
  savedAffirmations: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  ],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

UserSchema.methods.matchPasswords = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.pre<IUser>(
  'save',
  async function (next: (err?: mongoose.CallbackError) => void) {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    this.firstName = _.capitalize(this.firstName);
    this.lastName = _.capitalize(this.lastName);

    next();
  }
);

UserSchema.index({ firstName: 'text', lastName: 'text' });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;

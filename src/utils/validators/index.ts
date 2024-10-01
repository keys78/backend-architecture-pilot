import { z } from 'zod';

//auth
export const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().length(6, 'Invalid token'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6),
});


export const updateUserSchema = z.object({
  googleId: z.string().optional(),
  provider: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  // dob: z.date().optional(),
  dob: z.string().optional(),
  profileImage: z.string().optional(),
  communityInfo: z
    .object({
      joined: z.boolean().optional(),
      author: z.string().optional(),
      bio: z.string().optional(),
    })
    .optional(),
  onboardingInfo: z
    .object({
      onboarded: z.boolean().optional(),
      reminder: z.string().optional(),
      fearedWords: z.string().optional(),
    })
    .optional(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  // role: z.nativeEnum(UserRole).optional(),
  isVerified: z.boolean().optional(),
  resetPasswordToken: z.string().optional(),
  resetPasswordExpires: z.date().optional(),
});

//oboard user
export const onboardingSchema = z.object({
  why: z.string().min(1, 'Please select a reason to join.'),
  stutterGrade: z.string().min(1, 'Please select your stutter grade.'),
  dailyGoal: z
    .object({
      mindfulness: z.number().min(2).max(20).default(5),
      warmUp: z.number().min(2).max(20).default(5),
      games: z.number().min(2).max(20).default(5),
      scriptActing: z.number().min(2).max(20).default(5),
      reading: z.number().min(2).max(20).default(5),
    })
    .default({
      mindfulness: 5,
      warmUp: 5,
      games: 5,
      scriptActing: 5,
      reading: 5,
    }),
  dob: z.string().optional(),
  reminder: z.string().optional(),
});

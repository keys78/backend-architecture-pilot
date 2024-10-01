import { Response, NextFunction, RequestHandler, Request } from 'express';
import createHttpError from 'http-errors';
import UserModel from '../models/user.model';
import redis from '../utils/redisClient';
import { updateUserSchema } from './../utils/validators/index';
import { AuthRequest, extractPublicIdFromImageUrl } from '../utils/helpers';
import {
  RatingModel,
  FeatureRequestModel,
  BugReportModel,
} from '../models/feedback.model';
import { upload } from '../middleware/uploadMiddleware';
import { v2 as cloudinary } from 'cloudinary';
import QuoteModel from '../models/quotes.model';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const getUser: RequestHandler<{}, any, any> = async (
  req: AuthRequest,
  res: Response<any>,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw createHttpError(401, 'Unauthorized user');

    const cachedUser = await redis.get(`user:${userId}`);
    if (cachedUser) {
      return res.status(200).json(JSON.parse(cachedUser));
    }

    const user = await UserModel.findById(userId)
      .select('-password')
      .populate({
        path: 'savedAffirmations',
        model: QuoteModel,
        select: 'text date _id',
      });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    await redis.set(`user:${userId}`, JSON.stringify(user), 'EX', 3600); // Cache for 1 hour

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const userOnboarding: RequestHandler<{}, any, any> = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw createHttpError(401, 'Unauthorized');

    const { why, stutterGrade, dailyGoals, dob, reminder } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    user.onboardingInfo = { onboarded: true, why, stutterGrade, reminder };
    user.dailyGoals = dailyGoals;
    user.dob = dob;

    await user.save();
    // await redis.del(`user:${userId}`);

    res.status(200).json({
      success: true,
      message: 'Onboarding information updated successfully',
      redirectUrl: '/dashboard',
    });
  } catch (error) {
    next(error);
  }
};

// Update Profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw createHttpError(401, 'Unauthorized');

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      throw createHttpError(
        400,
        validation.error.errors.map((err) => err.message).join(', ')
      );
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    if (validation.data.communityInfo) {
      user.communityInfo = {
        ...user.communityInfo,
        ...validation.data.communityInfo, 
      };
    }

    Object.assign(user, validation.data);

    await user.save();
    await redis.del(`user:${userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const uploadFile: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    upload.single('image')(req, res, async (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message:
              'File size exceeds the limit. Maximum file size allowed is <= 5MB.',
          });
        }
        if (err.message === 'Only JPG, PNG, and GIF files are allowed') {
          return res.status(400).json({ message: err.message });
        }
        throw err;
      }

      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Find the existing user
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete the previous image from Cloudinary, if it exists
      if (existingUser.profileImage) {
        const imagePublicId = extractPublicIdFromImageUrl(
          existingUser.profileImage
        );
        const deletionResponse =
          await cloudinary.uploader.destroy(imagePublicId);
        if (deletionResponse.result !== 'ok') {
          return res
            .status(400)
            .json({ message: 'Error deleting previous image' });
        }
      }

      const randomString = `${'spi_uploads'}_${Math.random().toString(36).substring(2)}_${Date.now()}`;

      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'stuthera-profileImages-folder',
        public_id: randomString,
      });

      const imageUrl = uploadResult.secure_url;

      // Update existing user with new image URL
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { profileImage: imageUrl },
        { new: true }
      );
      // await redis.del(`user:${userId}`);

      return res
        .status(200)
        .json({ message: 'File upload was successful', data: updatedUser });
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) throw createHttpError(401, 'Unauthorized');

    const user = await UserModel.findById(userId).exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const imagePublicId = extractPublicIdFromImageUrl(user.profileImage as any);

    try {
      const deletionResponse = await cloudinary.uploader.destroy(imagePublicId);

      if (deletionResponse.result !== 'ok') {
        return res
          .status(400)
          .json({ message: 'Error deleting file from Cloudinary' });
      }
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        ok: false,
        message: 'Error deleting file',
        errors: error,
      });
    }

    // Update the user's profile image to null or empty
    user.profileImage = '';
    await user.save();
    // await redis.del(`user:${userId}`);

    res.status(200).json({ message: 'File erased!' });
  } catch (error) {
    next(error);
  }
};

// // Change Password
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw createHttpError(400, 'Current and new passwords are required');
    }

    const userId = req.user?._id;
    if (!userId) throw createHttpError(401, 'Unauthorized');

    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const isMatch = await user.matchPasswords(currentPassword);
    if (!isMatch) {
      throw createHttpError(400, 'Incorrect current password');
    }

    user.password = newPassword;

    await user.save();
    await redis.del(`user:${userId}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// // Rate App
export const rateApp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { stars, review } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      throw createHttpError(400, 'Stars must be between 1 and 5');
    }

    const userId = req.user?._id;
    if (!userId) throw createHttpError(401, 'Unauthorized');

    const rating = new RatingModel({
      userId,
      stars,
      review,
    });

    await rating.save();

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// // Delete Account
// export const deleteAccount = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?._id;
//     if (!userId) throw createHttpError(401, 'Unauthorized');

//     const { email } = req.body;
//     if (!email) {
//       throw createHttpError(400, 'Email is required to delete account');
//     }

//     const user = await UserModel.findOne({ email });
//     if (!user) {
//       throw createHttpError(404, 'User not found');
//     }

//     await UserModel.deleteOne({ _id: user._id });
//     // await redis.del(`user:${userId}`);

//     res.status(200).json({
//       success: true,
//       message: 'Account deleted successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Request a Feature
export const requestFeature = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, email } = req.body;
    if (!title || !description) {
      throw createHttpError(400, 'Title and description are required');
    }

    const featureRequest = new FeatureRequestModel({
      title,
      description,
      email,
    });

    await featureRequest.save();

    res.status(200).json({
      success: true,
      message: 'Feature request submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// // Report a Bug
export const reportBug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, email } = req.body;
    if (!title || !description) {
      throw createHttpError(400, 'Title and description are required');
    }

    const bugReport = new BugReportModel({
      title,
      description,
      email,
    });

    await bugReport.save();

    res.status(200).json({
      success: true,
      message: 'Bug report submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

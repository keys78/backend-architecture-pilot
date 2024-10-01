import { NextFunction, Response } from 'express';
import UserModel from '../models/user.model';
import ActivityModel from '../models/activity.model';
import QuoteModel from '../models/quotes.model';
import createHttpError from 'http-errors';
import { AuthRequest } from '../utils/helpers';
import mongoose from 'mongoose';
// import redis from '../utils/redisClient';

export const saveActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { date, title, timeSpent, activityNote, category } = req.body;

    if (!date || !title || !timeSpent || !category) {
      return res
        .status(400)
        .json({ message: 'All required fields must be provided.' });
    }

    const newActivity = new ActivityModel({
      userId,
      date: new Date(date),
      title,
      timeSpent,
      activityNote,
      category,
    });

    await newActivity.save();

    return res
      .status(201)
      .json({ message: 'Activity saved successfully', activity: newActivity });
  } catch (error) {
    next(error);
  }
};

export const getUserActivities = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    const activities = await ActivityModel.find({ userId });

    if (!activities || activities.length === 0) {
      return res.status(200).json([]);
    }

    // Group activities by category and format the output
    const groupedActivities = activities.reduce(
      (acc, activity) => {
        const { category, _id, date, title, timeSpent, activityNote } =
          activity;

        if (!acc[category]) {
          acc[category] = {
            category,
            list: [],
          };
        }

        acc[category].list.push({
          _id: _id as string,
          date,
          title,
          timeSpent,
          activityNote,
        });

        return acc;
      },
      {} as Record<
        string,
        {
          category: string;
          list: Array<{
            _id: string;
            date: Date;
            title: string;
            timeSpent: number;
            activityNote: string;
          }>;
        }
      >
    );

    const result = Object.values(groupedActivities);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTodayAffirmation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw createHttpError('401', 'Not authorized');
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const quote = await QuoteModel.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!quote) {
      throw createHttpError(404, 'No quote for today');
    }

    res.status(200).json(quote);
  } catch (error) {
    next(error);
  }
};

export const saveAffirmation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { affirmationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(affirmationId)) {
      throw createHttpError(400, 'Invalid affirmation ID');
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const affirmation = await QuoteModel.findById(affirmationId);

    if (!affirmation) {
      throw createHttpError(404, 'Affirmation not found');
    }

    if (user.savedAffirmations.includes(affirmationId)) {
      return res.status(400).json({ message: 'Affirmation already saved' });
    }

    user.savedAffirmations.push(affirmationId);
    await user.save();
    // await redis.del(`user:${userId}`);

    res.status(200).json({ message: 'Affirmation saved successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedAffirmation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { affirmationId } = req.params;

    if (!userId) {
      throw createHttpError(401, 'Unauthorized user');
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { savedAffirmations: { _id: affirmationId } } },
      { new: true }
    )

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({ message: 'Affirmation removed successfully', user });
  } catch (error) {
    next(error);
  }
};

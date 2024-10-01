import { RequestHandler, NextFunction, Response } from 'express';
import createHttpError from 'http-errors';
import MoodModel from '../models/mood.model';
import { AuthRequest } from '../utils/helpers';

export const createMood: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { date, mood, activity, journal } = req.body;

    if (!date || !mood) {
      throw createHttpError(400, 'Invalid request data');
    }

    //will see if should make activity and journal required latwr on
    const newMood = await MoodModel.create({
      userId,
      date,
      mood,
      activity,
      journal,
    });

    res.status(201).json(newMood);
  } catch (error) {
    next(error);
  }
};


export const updateMood: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { moodId } = req.params;
    const { date, mood, activity, journal } = req.body;

    const updatedMood = await MoodModel.findOneAndUpdate(
      { _id: moodId, userId },
      { date, mood, activity, journal },
      { new: true, runValidators: true }
    );

    if (!updatedMood) throw createHttpError(404, 'Mood entry not found');

    res.status(200).json(updatedMood);
  } catch (error) {
    next(error);
  }
};


export const getAllMoods: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    const moods = await MoodModel.find({ userId });

    if (!moods || moods.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(moods);
  } catch (error) {
    next(error);
  }
};

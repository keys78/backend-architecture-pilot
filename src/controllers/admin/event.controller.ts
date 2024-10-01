import { RequestHandler, NextFunction, Response } from 'express';
import createHttpError from 'http-errors';
import EventModel from '../../models/event.model';
import { AuthRequest } from '../../utils/helpers';

export const createEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date, startTime, endTime, title, meetLink, meetDescription } =
      req.body;

    if (!date || !startTime || !endTime || !title || !meetLink) {
      throw createHttpError(400, 'Invalid request data');
    }

    const newEvent = await EventModel.create({
      date,
      startTime,
      endTime,
      title,
      meetLink,
      meetDescription,
    });

    res.status(201).json(newEvent);
  } catch (error) {
    next(error);
  }
};

export const updateEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;
    const { date, startTime, endTime, title, meetLink, meetDescription } =
      req.body;

    const updatedEvent = await EventModel.findOneAndUpdate(
      { _id: eventId },
      { date, startTime, endTime, title, meetLink, meetDescription },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) throw createHttpError(404, 'Event entry not found');

    res.status(200).json(updatedEvent);
  } catch (error) {
    next(error);
  }
};

export const getAllEvents: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await EventModel.find();

    if (!events || events.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;

    const event = await EventModel.findById(eventId);
    if (!event) throw createHttpError(404, 'Event not found');

    await event.deleteOne();

    res.status(200).json({ message: 'Event Deleted!' });
  } catch (error) {
    next(error);
  }
};

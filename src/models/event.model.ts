import mongoose, { Schema, Document } from 'mongoose';

export interface Event {
  date: Date;
  startTime: string;
  endTime: string;
  title: string;
  meetLink: string;
  meetDescription: string;
}

const EventSchema: Schema = new Schema({
  date: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  title: { type: String, required: true },
  meetLink: { type: String, required: true },
  meetDescription: { type: String, required: false },
});

export interface EventDocument extends Event, Document {}

export default mongoose.model<EventDocument>('Event', EventSchema);
import mongoose, { Schema } from "mongoose";

export interface Day {
  userId: mongoose.Types.ObjectId;
  date: Date;
  mood: number;
  activity: string[];
  journal: string;
}

const MoodSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  date: { type: Date, required: true },
  mood: { type: Number, required: true },
  activity: { type: [String] },
  journal: { type: String },
});

export interface MoodDocument extends Day, Document {}

export default mongoose.model<MoodDocument>('Mood', MoodSchema);

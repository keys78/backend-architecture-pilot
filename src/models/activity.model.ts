import mongoose, { Schema, Document } from 'mongoose';

export interface Activity {
  userId: mongoose.Types.ObjectId;
  date: Date;
  title: string;
  timeSpent: number;
  activityNote: string;
  category: string;
}

const ActivitySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  timeSpent: { type: Number, required: true },
  activityNote: { type: String, required: true },
  category: { type: String, required: true },
});

export interface ActivityDocument extends Activity, Document {}

export default mongoose.model<ActivityDocument>('Activity', ActivitySchema);
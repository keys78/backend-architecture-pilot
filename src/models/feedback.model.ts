import mongoose, { Schema, Document } from 'mongoose';

interface IRating extends Document {
  userId: mongoose.Types.ObjectId;
  stars: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}


interface IFeatureRequest extends Document {
  title: string;
  description: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}


interface IBugReport extends Document {
  title: string;
  description: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rating
const RatingSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
  },
  { timestamps: true }
);

// Feature Reques
const FeatureRequestSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    email: { type: String },
  },
  { timestamps: true }
);

// Bug Report
const BugReportSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    email: { type: String },
  },
  { timestamps: true }
);

const RatingModel = mongoose.model<IRating>('Rating', RatingSchema);
const FeatureRequestModel = mongoose.model<IFeatureRequest>(
  'FeatureRequest',
  FeatureRequestSchema
);
const BugReportModel = mongoose.model<IBugReport>('BugReport', BugReportSchema);

export { RatingModel, FeatureRequestModel, BugReportModel };
import mongoose, { Document, Schema } from 'mongoose';

export interface IQuote extends Document {
  text: string;
  date: Date;
}

const quoteSchema: Schema<IQuote> = new Schema({
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const QuoteModel = mongoose.model<IQuote>('Quote', quoteSchema);

export default QuoteModel;

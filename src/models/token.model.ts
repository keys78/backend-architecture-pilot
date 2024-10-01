import mongoose, { Document, Schema } from 'mongoose';

interface TokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const tokenSchema = new Schema<TokenDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const TokenModel = mongoose.model<TokenDocument>('Token', tokenSchema);

export default TokenModel;





























// import mongoose, { Document, Schema, Types } from 'mongoose';

// interface IToken extends Document {
//   token: string;
//   userId: Types.ObjectId;
//   removeToken: () => Promise<void>;
// }

// const tokenSchema = new Schema({
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   token: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now, expires: 300 }, // 5 minutes
// });

// const TokenModel = mongoose.model<IToken>('Token', tokenSchema);
// export default TokenModel;
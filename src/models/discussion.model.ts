import { Document, Schema, model, Types } from 'mongoose';

// Post model
export interface IPost extends Document {
  author: Types.ObjectId;
  content: string;
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  bookmarks: Types.ObjectId[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'Like' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Bookmark' }],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ content: 'text', });

export const PostModel = model<IPost>('Post', postSchema, 'posts');


// Comment model
export interface IComment extends Document {
  author: Types.ObjectId;
  post: Types.ObjectId;
  content: string;
  likes: Types.ObjectId[];
  replies: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    content: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
  },
  { timestamps: true }
);

commentSchema.index({ content: 'text' });

export const CommentModel = model<IComment>(
  'Comment',
  commentSchema,
  'comments'
);

// for replies under comments
export interface IReply extends Document {
  author: Types.ObjectId;
  comment: Types.ObjectId;
  content: string;
  tags: Types.ObjectId[]; // Users tagged in the reply
  createdAt: Date;
  updatedAt: Date;
}

const replySchema = new Schema<IReply>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment', required: true },
    content: { type: String, required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Users tagged in the reply
  },
  { timestamps: true }
);

export const ReplyModel = model<IReply>('Reply', replySchema, 'replies');


// Like model
export interface ILike extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
  comment?: Types.ObjectId;
}

const likeSchema = new Schema<ILike>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
});

export const LikeModel = model<ILike>('Like', likeSchema, 'liked');

// Bookmark model
export interface IBookmark extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
}

const bookmarkSchema = new Schema<IBookmark>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
});

export const BookmarkModel = model<IBookmark>(
  'Bookmark',
  bookmarkSchema,
  'bookmarks'
);

// View model
export interface IView extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
}

const viewSchema = new Schema<IView>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
});

export const ViewModel = model<IView>('View', viewSchema, 'views');


// reportModel
export interface IReport extends Document {
  post: Types.ObjectId;
  user: Types.ObjectId;
  reason: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    comments: { type: String },
  },
  { timestamps: true }
);

export const ReportModel = model<IReport>('Report', reportSchema, 'reports');

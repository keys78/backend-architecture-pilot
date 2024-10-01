import { NextFunction, RequestHandler, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import createHttpError from 'http-errors';
import {
  PostModel,
  CommentModel,
  ViewModel,
  LikeModel,
  BookmarkModel,
  ReplyModel,
  ReportModel,
} from '../models/discussion.model';
import UserModel from '../models/user.model';
import { AuthRequest } from '../utils/helpers';
import { getIO } from '../services/socket/socket';

const validateObjectId = (id: any) => {
  return mongoose.Types.ObjectId.isValid(id);
};
const validateObjectIds = (id: any): mongoose.Types.ObjectId | false => {
  return mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : false;
};

//Community onboarding controller
export const communityOnboarding: RequestHandler = async (
  req: AuthRequest,
  res,
  next
) => {
  try {
    const { username } = req.body;
    const userId = req.user?._id;

    if (!userId) throw createHttpError(401, 'Unauthorized');
    if (!username) throw createHttpError(400, 'Username is required');

    const user = await UserModel.findById(userId);
    if (!user) throw createHttpError(404, 'User not found');

    user.communityInfo.joined = true;
    user.communityInfo.author = username;

    await user.save();

    res.status(200).json({
      message: 'User successfully onboarded to the community',
      user: {
        _id: user._id,
        communityInfo: user.communityInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

//GET ALL posts
export const getAllPosts: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cursor, limit = 10 } = req.query;
    const limitNumber = Number(limit);

    const query =
      cursor && validateObjectId(cursor) ? { _id: { $lt: cursor } } : {};

    const posts = await PostModel.find(query)
      .sort({ _id: -1 })
      .limit(limitNumber)
      .populate({
        path: 'author',
        select:
          '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select:
            '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
        },
      })
      .populate({
        path: 'likes',
        select: 'user',
      })
      .populate({
        path: 'bookmarks',
        select: 'user',
      })
      .lean();

    const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;
    const totalPosts = await PostModel.countDocuments();

    res.status(200).json({ posts, nextCursor, totalPosts });
  } catch (error) {
    next(error);
  }
};

//get Trending posts also||||||||||||||

const WEIGHTS = {
  likes: 0.5,
  comments: 0.3,
  views: 0.2,
};

// Function to get trending posts
export const getTrendingPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cursor, limit = 10 } = req.query;
    const limitNumber = Number(limit);

    // Calculate the trending score for each post in my case I used 'likes', 'comments', and 'views' fields
    const calculateTrendingScore = (post: any) =>
      post.likes * WEIGHTS.likes +
      post.comments.length * WEIGHTS.comments +
      post.views * WEIGHTS.views;

    // Create query for pagination
    const query =
      cursor && validateObjectId(cursor) ? { _id: { $lt: cursor } } : {};

    // Fetch posts from the database with cursor-based pagination
    const posts = await PostModel.find(query)
      .sort({ _id: -1 }) // Start with the latest posts
      .limit(100)
      .populate({
        path: 'author',
        select:
          '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
      })
      .populate('comments')
      .lean();

    // Calculate scores and add them to the posts
    const postsWithScores = posts.map((post) => {
      const score = calculateTrendingScore(post);
      return { ...post, score }; // Include score in the returned post object
    });

    const sortedPosts = postsWithScores.sort((a, b) => b.score - a.score);

    const trendingPosts = sortedPosts.slice(0, limitNumber);

    const nextCursor =
      trendingPosts.length > 0
        ? trendingPosts[trendingPosts.length - 1]._id
        : null;

    res.status(200).json({ posts: trendingPosts, nextCursor });
  } catch (error) {
    next(error);
  }
};

// Get a single post
export const getPost: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const post = await PostModel.findById(postId)
      .populate({
        path: 'author',
        select:
          '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select:
            '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
        },
      });

    if (!post) throw createHttpError(404, 'Post not found');

    post.views += 1;
    await post.save();

    res.status(200).json({ posts: [post], nextCursor: null });
  } catch (error) {
    next(error);
  }
};

//Create a new post
export const createPost: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId || !content) throw createHttpError(400, 'Invalid request data');

    const newPost = await PostModel.create({ author: userId, content });

    const populatedPost = await PostModel.findById(newPost._id)
      .populate({
        path: 'author',
        select:
          '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
      })
      .populate('comments')
      .lean();

    const io = getIO();
    io.emit('postCreated', populatedPost);

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

export const searchPosts: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const query = Array.isArray(req.query.query)
    ? req.query.query[0]
    : req.query.query;

  if (typeof query !== 'string' || !query.trim()) {
    return res
      .status(400)
      .json({ message: 'Valid query parameter is required' });
  }

  try {
    const posts = await PostModel.find({
      $text: { $search: query },
    }).exec();

    res.json({ posts, nextCursor: null });
  } catch (error) {
    next(error);
  }
};

// Update a post
export const editPost: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId || !content) throw createHttpError(400, 'Invalid request data');

    const post = await PostModel.findById(postId);

    if (!post) throw createHttpError(404, 'Post not found');
    if (post.author.toString() !== userId.toString())
      throw createHttpError(403, 'Forbidden');

    post.content = content;
    await post.save();

    const io = getIO();
    io.emit('postUpdated', post);
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const deletePost: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const userId = req.user?._id;

    const post = await PostModel.findById(postId);

    if (!post) throw createHttpError(404, 'Post not found');
    if (post.author.toString() !== userId.toString())
      throw createHttpError(403, 'Forbidden');

    const comments = await CommentModel.find({ post: postId });
    const commentIds = comments.map((comment) => comment._id);

    await ReplyModel.deleteMany({ comment: { $in: commentIds } });

    await CommentModel.deleteMany({ post: postId });

    await LikeModel.deleteMany({ post: postId });

    await BookmarkModel.deleteMany({ post: postId });

    await ReportModel.deleteMany({ post: postId });

    await ViewModel.deleteMany({ post: postId });

    await post.deleteOne();

    const io = getIO();
    io.emit('postDeleted', postId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const toggleLikePost: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { postId } = req.params;
  const userId = req.user?._id;

  try {
    if (!validateObjectId(postId) || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.likes) {
      post.likes = [];
    }

    const existingLike = await LikeModel.findOne({
      user: userId,
      post: postId,
    });

    if (existingLike) {
      await LikeModel.deleteOne({ _id: existingLike._id as Types.ObjectId });
      post.likes = post.likes.filter(
        (like) => !like.equals(existingLike._id as Types.ObjectId)
      );
    } else {
      const newLike = await LikeModel.create({ user: userId, post: postId });
      post.likes.push(newLike._id as Types.ObjectId);
    }

    await post.save();

    const io = getIO();
    io.emit('postLiked', {
      postId: post._id,
      likes: post.likes,
      likedByUser: !existingLike,
    });

    res.status(200).json({ message: 'Like toggled successfully', post });
  } catch (error) {
    next(error);
  }
};

// Create a comment
export const createComment: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId || !content) {
      throw createHttpError(400, 'Invalid request data');
    }

    const newComment = await CommentModel.create({
      author: userId,
      post: postId,
      content,
    });

    // Find the post and update its comments array
    const post = await PostModel.findById(postId);
    if (!post) {
      throw createHttpError(404, 'Post not found');
    }

    post.comments.push(newComment._id as any);
    await post.save();

    // Emit event for the new comment
    const io = getIO();
    io.emit('commentCreated', newComment);

    // Respond with the created comment
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!userId) throw createHttpError(401, 'Unauthorized');
    if (!commentId) throw createHttpError(400, 'Comment ID is required');

    const comment = await CommentModel.findById(commentId);

    if (!comment) throw createHttpError(404, 'Comment not found');
    if (comment.author.toString() !== userId.toString())
      throw createHttpError(403, 'Forbidden');

    await ReplyModel.deleteMany({ comment: commentId });

    await comment.deleteOne();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const toggleBookmarkPost: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { postId } = req.params;
  const userId = req.user?._id;

  try {
    if (!validateObjectId(postId) || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.bookmarks) {
      post.bookmarks = [];
    }

    const existingBookmark = await BookmarkModel.findOne({
      user: userId,
      post: postId,
    });

    if (existingBookmark) {
      await BookmarkModel.deleteOne({ _id: existingBookmark._id });
      post.bookmarks = post.bookmarks.filter(
        (bookmark) => !bookmark.equals(existingBookmark._id as string)
      );
    } else {
      const newBookmark = await BookmarkModel.create({
        user: userId,
        post: postId,
      });
      post.bookmarks.push(newBookmark._id as any);
    }

    await post.save();

    const io = getIO();
    io.emit('postBookmarked', {
      postId: post._id,
      bookmarks: post.bookmarks,
      bookmarkedByUser: !existingBookmark,
    });

    res.status(200).json({ message: 'Bookmark toggled successfully', post });
  } catch (error) {
    next(error);
  }
};

// Add a view to a post
export const addView: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const userId = req.user?._id;

    await ViewModel.create({ user: userId, post: postId });
    const post = await PostModel.findById(postId);
    post!.views += 1;
    await post!.save();

    const io = getIO();
    io.emit('postViewed', { postId, userId });
    res.status(200).json({ message: 'View added' });
  } catch (error) {
    next(error);
  }
};

export const getUserPosts: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { cursor, limit = 10 } = req.query;
    const limitNumber = Number(limit);

    if (!validateObjectId(userId))
      throw createHttpError(400, 'Invalid user ID');

    const query =
      cursor && validateObjectId(cursor)
        ? { author: userId, _id: { $lt: cursor } }
        : { author: userId };

    const posts = await PostModel.find(query)
      .sort({ _id: -1 })
      .limit(limitNumber)
      .populate({
        path: 'author',
        select:
          '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
      })
      .lean();

    const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

    res.status(200).json({ posts, nextCursor });
  } catch (error) {
    next(error);
  }
};

export const getUserComments: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { cursor, limit = 10 } = req.query;
    const limitNumber = Number(limit);

    if (!validateObjectId(userId))
      throw createHttpError(400, 'Invalid user ID');

    const query =
      cursor && validateObjectId(cursor)
        ? { author: userId, _id: { $lt: cursor } }
        : { author: userId };

    const comments = await CommentModel.find(query)
      .sort({ _id: -1 })
      .limit(limitNumber)
      .populate({
        path: 'author',
        select:
          '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
      })
      .populate({
        path: 'post',
        select: 'content likes comments bookmarks views',
        populate: {
          path: 'author',
          select:
            '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
        },
      })
      .lean();

    const nextCursor =
      comments.length > 0 ? comments[comments.length - 1]._id : null;

    res.status(200).json({ comments, nextCursor });
  } catch (error) {
    next(error);
  }
};

export const getUserLikedPosts: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { cursor, limit = 10 } = req.query;
    const limitNumber = Number(limit);

    if (!validateObjectId(userId)) {
      throw createHttpError(400, 'Invalid user ID');
    }

    let likedPostsQuery: {
      user: mongoose.Types.ObjectId;
      _id?: { $lt: mongoose.Types.ObjectId };
    } = {
      user: validateObjectIds(userId) as mongoose.Types.ObjectId,
    };

    if (cursor && validateObjectId(cursor)) {
      likedPostsQuery._id = {
        $lt: validateObjectIds(cursor) as mongoose.Types.ObjectId,
      };
    }

    const likedPosts = await LikeModel.find(likedPostsQuery)
      .sort({ _id: -1 })
      .limit(limitNumber)
      .lean();

    const postIds = likedPosts.map((like) => like.post);

    // Fetch posts based on extracted post IDs
    const posts = await PostModel.find({ _id: { $in: postIds } })
      .sort({ _id: -1 })
      .limit(limitNumber)
      .populate({
        path: 'author',
        select:
          '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
      })
      .populate({
        path: 'comments',
        select: 'content author',
        populate: { path: 'author', select: '_id firstName profileImage' },
      })
      .populate({
        path: 'bookmarks',
        select: 'user',
      })
      .populate({
        path: 'views',
        select: 'user',
      })
      .lean();

    const nextCursor =
      posts.length > 0 ? posts[posts.length - 1]._id.toString() : null;

    res.status(200).json({ posts, nextCursor });
  } catch (error) {
    next(error);
  }
};

export const getUserBookmarkedPosts: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { cursor, limit = 10 } = req.query;
    const limitNumber = Number(limit);

    if (!userId || !validateObjectId(userId)) {
      throw createHttpError(400, 'Invalid user ID');
    }

    const bookmarkQuery: any = { user: userId };

    if (cursor && validateObjectId(cursor)) {
      bookmarkQuery._id = { $lt: cursor };
    }

    const bookmarks = await BookmarkModel.find(bookmarkQuery)
      .sort({ _id: -1 })
      .limit(limitNumber)
      .lean();

    const postIds = bookmarks.map((bookmark) => bookmark.post);

    const posts = await PostModel.find({ _id: { $in: postIds } })
      .sort({ _id: -1 })
      .populate({
        path: 'author',
        select:
          '_id firstName profileImage communityInfo.author communityInfo.joined isDeletedUser',
      })
      .lean();

    // Determine the next cursor
    const nextCursor =
      bookmarks.length > 0 ? bookmarks[bookmarks.length - 1]._id : null;

    res.status(200).json({ posts, nextCursor });
  } catch (error) {
    next(error);
  }
};

export const createReply: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId || !content) throw createHttpError(400, 'Invalid request data');

    const newReply = await ReplyModel.create({
      author: userId,
      comment: commentId,
      content,
      // tags,
    });

    const comment = await CommentModel.findById(commentId);
    if (!comment) throw createHttpError(404, 'Comment not found');

    comment.replies.push(newReply._id as any);
    await comment.save();

    res.status(201).json(newReply);
  } catch (error) {
    next(error);
  }
};

export const deleteReply: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { replyId } = req.params;
    const userId = req.user?._id;

    const reply = await ReplyModel.findById(replyId);
    if (!reply) throw createHttpError(404, 'Reply not found');
    if (reply.author.toString() !== userId.toString())
      throw createHttpError(403, 'Forbidden');

    // Find the comment and remove the reply from its replies array
    const comment = await CommentModel.findById(reply.comment);
    if (comment) {
      // comment.replies.pull(replyId);
      await comment.save();
    }

    await reply.deleteOne();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getRepliesForComment: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentId } = req.params;
    const { cursor, limit = 10 } = req.query;
    const limitNumber = Number(limit);

    if (!validateObjectId(commentId))
      throw createHttpError(400, 'Invalid comment ID');

    const query =
      cursor && validateObjectId(cursor)
        ? { _id: { $lt: cursor }, comment: commentId }
        : { comment: commentId };

    const replies = await ReplyModel.find(query)
      .sort({ _id: -1 })
      .limit(limitNumber)
      .populate({
        path: 'author',
        select: '_id firstName profileImage',
      })
      .lean();

    const totalReplies = await ReplyModel.countDocuments({
      comment: commentId,
    });

    const nextCursor =
      replies.length > 0 ? replies[replies.length - 1]._id : null;

    res.status(200).json({ replies, nextCursor, totalReplies });
  } catch (error) {
    next(error);
  }
};

// Report a post
export const reportPost: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const { reason, comments } = req.body;
    const userId = req.user?._id;

    if (!userId || !reason) throw createHttpError(400, 'Invalid report data');

    const newReport = await ReportModel.create({
      post: postId,
      user: userId,
      reason,
      comments,
    });

    //email notifivation will be here

    res
      .status(201)
      .json({ message: 'Report submitted successfully', report: newReport });
  } catch (error) {
    next(error);
  }
};

export const getReportsForPost: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;

    const reports = await ReportModel.find({ post: postId })
      .populate({
        path: 'user',
        select: '_id firstName profileImage',
      })
      .lean();

    res.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
};

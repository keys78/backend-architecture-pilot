import express from 'express';
import {
  createPost,
  getAllPosts,
  getPost,
  editPost,
  deletePost,
  toggleLikePost,
  createComment,
  reportPost,
  addView,
  getTrendingPosts,
  getUserBookmarkedPosts,
  getUserComments,
  getUserLikedPosts,
  getUserPosts,
  searchPosts,
  createReply,
  getRepliesForComment,
  deleteReply,
  toggleBookmarkPost,
  getReportsForPost,
  communityOnboarding,
  deleteComment,
} from '../controllers/discussion.controller';
import { authorizedUser } from '../middleware/authProtect';

const router = express.Router();

router.use(authorizedUser)

router.post('/onboarding', communityOnboarding);
router.post('/create-post', createPost);
router.get('/get-all-posts', getAllPosts);
router.get('/trending-posts', getTrendingPosts);
router.get('/search', searchPosts); //my search -- { mongoose search or elastic search }
router.post('/:postId/like', toggleLikePost);
router.get('/:postId', getPost);
router.put('/edit-post/:postId', editPost);
router.delete('/delete-post/:postId', deletePost);
router.post('/:postId/comment', createComment);
router.delete('/:commentId/comment', deleteComment);
router.post('/:postId/bookmark', toggleBookmarkPost);
router.post('/:postId/view', addView);

router.post('/user/bookmarked', getUserBookmarkedPosts);
router.post('/user/commented', getUserComments);
router.post('/user/liked', getUserLikedPosts);
router.post('/user/posts', getUserPosts);

router.post('/comments/:commentId/replies', createReply);
router.delete('/replies/:replyId', deleteReply);
router.get('/comments/:commentId/replies', getRepliesForComment);

router.post('/:postId/report', reportPost);
router.get('/:postId/reports', getReportsForPost);


export default router;

import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import communityRoutes from './community.routes';
import moodRoutes from './mood.routes';
import activityRoutes from './activity.routes';
import eventRoutes from './admin/event.routes'

const router = express.Router();

router.use('/v1.0/auth', authRoutes);
router.use('/v1.0/user', userRoutes);
router.use('/v1.0/community', communityRoutes);
router.use('/v1.0/mood', moodRoutes);
router.use('/v1.0/activity', activityRoutes);
router.use('/v1.0/event', eventRoutes);

export default router;

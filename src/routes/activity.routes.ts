import express from 'express';
import {
  deleteSavedAffirmation,
  getTodayAffirmation,
  getUserActivities,
  saveActivity,
  saveAffirmation,
} from '../controllers/activity.controller';
import { authorizedUser } from '../middleware/authProtect';

const router = express.Router();

router.use(authorizedUser);

router.get('/', getUserActivities);
router.post('/', saveActivity);
router.get('/quote/today', getTodayAffirmation);
router.post('/quote/save', saveAffirmation);
router.delete('/quote/:id', deleteSavedAffirmation);

export default router;

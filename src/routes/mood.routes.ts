import express from 'express';
import {
  getAllMoods,
  createMood,
  updateMood,
} from '../controllers/mood.controller';
import { authorizedUser } from '../middleware/authProtect';

const router = express.Router();

router.use(authorizedUser);


router.get('/get-all-mood', getAllMoods);

router.post('/create-mood', createMood);

router.put('/update-mood/:moodId', updateMood);

export default router;

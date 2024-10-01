import express from 'express';
import { getAllEvents, updateEvent, createEvent, deleteEvent } from '../../controllers/admin/event.controller';
import { authorizedUser } from '../../middleware/authProtect';

const router = express.Router();

router.use(authorizedUser);

router.get('/get-all-events', getAllEvents);
router.post('/create-event', createEvent);
router.put('/edit-event/:eventId', updateEvent); 
router.delete('/delete-event/:eventId', deleteEvent); 


export default router;

import express from 'express';
import { joinQueue, getEntryByToken, getQueueEntries, updateEntryStatus, callNext, callSpecific } from '../controllers/entryController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/join/:code', joinQueue);
router.get('/track/:token', getEntryByToken);

// Protected routes (Staff)
router.get('/queue/:queueId', protect, getQueueEntries);
router.patch('/:id/status', protect, updateEntryStatus);
router.post('/queue/:queueId/call-next', protect, callNext);
router.post('/:id/call', protect, callSpecific);

export default router;

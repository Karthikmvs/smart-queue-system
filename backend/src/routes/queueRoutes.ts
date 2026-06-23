import express from 'express';
import { createQueue, getQueues, getQueueByCode, deleteQueue, resetQueue } from '../controllers/queueController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createQueue);
router.get('/', protect, getQueues);
router.get('/public/:code', getQueueByCode);
router.delete('/:id', protect, deleteQueue);
router.post('/:id/reset', protect, resetQueue);

export default router;

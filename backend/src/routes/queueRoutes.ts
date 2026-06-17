import express from 'express';
import { createQueue, getQueues, getQueueByCode, deleteQueue } from '../controllers/queueController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createQueue);
router.get('/', protect, getQueues);
router.get('/public/:code', getQueueByCode);
router.delete('/:id', protect, deleteQueue);

export default router;

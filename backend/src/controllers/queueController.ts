import { Response } from 'express';
import Queue from '../models/Queue';
import QueueEntry from '../models/QueueEntry';
import { AuthRequest } from '../middleware/authMiddleware';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateQueueCode = (): string => {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
};

export const createQueue = async (req: AuthRequest, res: Response) => {
  const { queueName, averageServiceTime } = req.body;

  try {
    if (!queueName || !averageServiceTime) {
      return res.status(400).json({ message: 'Queue name and average service time are required' });
    }

    const parsedServiceTime = Number(averageServiceTime);
    if (isNaN(parsedServiceTime) || parsedServiceTime <= 0) {
      return res.status(400).json({ message: 'Average service time must be a positive number' });
    }

    let prefix = queueName.trim().charAt(0).toUpperCase();
    if (!/^[A-Z]$/.test(prefix)) prefix = 'A';

    // Auto-generate unique queue code with retry
    let queueCode = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateQueueCode();
      const exists = await Queue.findOne({ queueCode: candidate });
      if (!exists) {
        queueCode = candidate;
        break;
      }
    }
    if (!queueCode) {
      return res.status(500).json({ message: 'Failed to generate unique queue code. Please try again.' });
    }

    const queue = await Queue.create({
      queueName,
      queueCode,
      averageServiceTime: parsedServiceTime,
      tokenPrefix: prefix,
      lastTokenNumber: 0,
      createdBy: req.user._id,
    });

    return res.status(201).json(queue);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getQueues = async (req: AuthRequest, res: Response) => {
  try {
    const queues = await Queue.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

    const queuesWithStats = await Promise.all(
      queues.map(async (queue) => {
        const waitingCount = await QueueEntry.countDocuments({ queueId: queue._id, status: 'waiting' });
        const servedCount = await QueueEntry.countDocuments({ queueId: queue._id, status: 'served' });
        const activeEntry = await QueueEntry.findOne({ queueId: queue._id, status: 'called' }).sort({ calledAt: -1 });

        return {
          ...queue.toObject(),
          waitingCount,
          servedCount,
          currentServing: activeEntry ? activeEntry.token : 'None',
        };
      })
    );

    return res.json(queuesWithStats);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getQueueByCode = async (req: AuthRequest, res: Response) => {
  const { code } = req.params;

  try {
    const queue = await Queue.findOne({ queueCode: code.toUpperCase() });

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const waitingCount = await QueueEntry.countDocuments({ queueId: queue._id, status: 'waiting' });
    const currentServingEntry = await QueueEntry.findOne({ queueId: queue._id, status: 'called' }).sort({ calledAt: -1 });

    return res.json({
      ...queue.toObject(),
      waitingCount,
      currentServing: currentServingEntry ? currentServingEntry.token : 'None',
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteQueue = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const queue = await Queue.findById(id);

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    if (queue.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this queue' });
    }

    await Queue.findByIdAndDelete(id);
    await QueueEntry.deleteMany({ queueId: id });

    const io = req.app.get('io');
    if (io) {
      io.to(id.toString()).emit('queue_updated', { queueId: id });
    }

    return res.json({ message: 'Queue and all associated entries deleted successfully', queueId: id });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const resetQueue = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const queue = await Queue.findById(id);

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    if (queue.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reset this queue' });
    }

    await QueueEntry.deleteMany({ queueId: id });
    await Queue.findByIdAndUpdate(id, { lastTokenNumber: 0 });

    const io = req.app.get('io');
    if (io) {
      io.to(id.toString()).emit('queue_updated', { queueId: id });
    }

    return res.json({ message: 'Queue reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

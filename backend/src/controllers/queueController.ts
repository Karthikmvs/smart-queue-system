import { Request, Response } from 'express';
import Queue from '../models/Queue';
import QueueEntry from '../models/QueueEntry';

export const createQueue = async (req: Request, res: Response) => {
  const { queueName, queueCode, averageServiceTime } = req.body;

  try {
    if (!queueName || !queueCode || !averageServiceTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const codeNormalized = queueCode.trim().toLowerCase().replace(/\s+/g, '-');
    const queueExists = await Queue.findOne({ queueCode: codeNormalized });

    if (queueExists) {
      return res.status(400).json({ message: 'Queue with this code already exists' });
    }

    // Extract first character of the queue name as token prefix, fallback to 'A'
    let prefix = queueName.trim().charAt(0).toUpperCase();
    if (!/^[A-Z]$/.test(prefix)) {
      prefix = 'A';
    }

    const queue = await Queue.create({
      queueName,
      queueCode: codeNormalized,
      averageServiceTime: Number(averageServiceTime),
      tokenPrefix: prefix,
      lastTokenNumber: 0,
    });

    return res.status(201).json(queue);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getQueues = async (req: Request, res: Response) => {
  try {
    const queues = await Queue.find({}).sort({ createdAt: -1 });

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

export const getQueueByCode = async (req: Request, res: Response) => {
  const { code } = req.params;

  try {
    const queue = await Queue.findOne({ queueCode: code.toLowerCase() });

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

export const deleteQueue = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const queue = await Queue.findById(id);

    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    // Cascade delete: delete the queue and all its associated entries
    await Queue.findByIdAndDelete(id);
    await QueueEntry.deleteMany({ queueId: id });

    // Broadcast a socket event to update clients if needed, or simply return success
    const io = req.app.get('io');
    if (io) {
      // Broadcast that queue update happened so any tracking page can refresh or get notified
      io.to(id.toString()).emit('queue_updated', { queueId: id });
    }

    return res.json({ message: 'Queue and all associated entries deleted successfully', queueId: id });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

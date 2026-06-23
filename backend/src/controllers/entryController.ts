import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Queue from '../models/Queue';
import QueueEntry from '../models/QueueEntry';
import { AuthRequest } from '../middleware/authMiddleware';

export const joinQueue = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { customerName } = req.body;

  try {
    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    const queue = await Queue.findOne({ queueCode: code.toLowerCase() });
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    // Return existing active entry for same customer (idempotent join)
    const trimmedName = customerName.trim();
    const existingEntry = await QueueEntry.findOne({
      queueId: queue._id,
      customerName: { $regex: new RegExp(`^${trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
      status: { $in: ['waiting', 'called'] },
    });

    if (existingEntry) {
      return res.status(200).json(existingEntry);
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      queue._id,
      { $inc: { lastTokenNumber: 1 } },
      { new: true }
    );

    if (!updatedQueue) {
      return res.status(500).json({ message: 'Error generating token' });
    }

    const paddedNum = String(updatedQueue.lastTokenNumber).padStart(3, '0');
    const token = `${updatedQueue.tokenPrefix}${paddedNum}`;

    const entry = await QueueEntry.create({
      customerName: trimmedName,
      queueId: queue._id,
      token,
      status: 'waiting',
      joinedAt: new Date(),
    });

    const io = req.app.get('io');
    if (io) {
      io.to(queue._id.toString()).emit('queue_updated', { queueId: queue._id });
    }

    return res.status(201).json(entry);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getEntryByToken = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { queue } = req.query;

  try {
    let query: any = { token: token.toUpperCase() };

    if (queue) {
      if (mongoose.Types.ObjectId.isValid(queue as string)) {
        query.queueId = queue;
      } else {
        const foundQueue = await Queue.findOne({ queueCode: (queue as string).toLowerCase() });
        if (!foundQueue) {
          return res.status(404).json({ message: 'Queue not found' });
        }
        query.queueId = foundQueue._id;
      }
    }

    const entry = await QueueEntry.findOne(query).populate('queueId').sort({ joinedAt: -1 });

    if (!entry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    const queueId = entry.queueId._id;

    const peopleAhead = await QueueEntry.countDocuments({
      queueId,
      status: 'waiting',
      joinedAt: { $lt: entry.joinedAt },
    });

    const currentServingEntry = await QueueEntry.findOne({ queueId, status: 'called' }).sort({ calledAt: -1 });

    return res.json({
      entry,
      peopleAhead,
      currentServing: currentServingEntry ? currentServingEntry.token : 'None',
      averageServiceTime: (entry.queueId as any).averageServiceTime,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getQueueEntries = async (req: AuthRequest, res: Response) => {
  const { queueId } = req.params;

  try {
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    if (queue.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this queue' });
    }

    const entries = await QueueEntry.find({ queueId }).sort({ joinedAt: 1 });
    return res.json(entries);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const updateEntryStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!['waiting', 'called', 'served', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const entry = await QueueEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    const queue = await Queue.findById(entry.queueId);
    if (!queue || queue.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this entry' });
    }

    entry.status = status;
    if (status === 'called') entry.calledAt = new Date();
    else if (status === 'served') entry.servedAt = new Date();
    await entry.save();

    const io = req.app.get('io');
    if (io) {
      io.to(entry.queueId.toString()).emit('queue_updated', { queueId: entry.queueId });
      if (status === 'called') {
        io.to(entry.queueId.toString()).emit('customer_called', {
          queueId: entry.queueId,
          token: entry.token,
          customerName: entry.customerName,
        });
      }
    }

    return res.json(entry);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const callNext = async (req: AuthRequest, res: Response) => {
  const { queueId } = req.params;

  try {
    const queue = await Queue.findById(queueId);
    if (!queue) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    if (queue.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this queue' });
    }

    await QueueEntry.updateMany(
      { queueId, status: 'called' },
      { status: 'served', servedAt: new Date() }
    );

    const nextEntry = await QueueEntry.findOne({ queueId, status: 'waiting' }).sort({ joinedAt: 1 });

    const io = req.app.get('io');

    if (!nextEntry) {
      if (io) io.to(queueId).emit('queue_updated', { queueId });
      return res.json({ message: 'No customers waiting in queue', entry: null });
    }

    nextEntry.status = 'called';
    nextEntry.calledAt = new Date();
    await nextEntry.save();

    if (io) {
      io.to(queueId).emit('queue_updated', { queueId });
      io.to(queueId).emit('customer_called', {
        queueId,
        token: nextEntry.token,
        customerName: nextEntry.customerName,
      });
    }

    return res.json(nextEntry);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

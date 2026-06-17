"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQueue = exports.getQueueByCode = exports.getQueues = exports.createQueue = void 0;
const Queue_1 = __importDefault(require("../models/Queue"));
const QueueEntry_1 = __importDefault(require("../models/QueueEntry"));
const createQueue = async (req, res) => {
    const { queueName, queueCode, averageServiceTime } = req.body;
    try {
        if (!queueName || !queueCode || !averageServiceTime) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const codeNormalized = queueCode.trim().toLowerCase().replace(/\s+/g, '-');
        const queueExists = await Queue_1.default.findOne({ queueCode: codeNormalized });
        if (queueExists) {
            return res.status(400).json({ message: 'Queue with this code already exists' });
        }
        // Extract first character of the queue name as token prefix, fallback to 'A'
        let prefix = queueName.trim().charAt(0).toUpperCase();
        if (!/^[A-Z]$/.test(prefix)) {
            prefix = 'A';
        }
        const queue = await Queue_1.default.create({
            queueName,
            queueCode: codeNormalized,
            averageServiceTime: Number(averageServiceTime),
            tokenPrefix: prefix,
            lastTokenNumber: 0,
        });
        return res.status(201).json(queue);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.createQueue = createQueue;
const getQueues = async (req, res) => {
    try {
        const queues = await Queue_1.default.find({}).sort({ createdAt: -1 });
        const queuesWithStats = await Promise.all(queues.map(async (queue) => {
            const waitingCount = await QueueEntry_1.default.countDocuments({ queueId: queue._id, status: 'waiting' });
            const servedCount = await QueueEntry_1.default.countDocuments({ queueId: queue._id, status: 'served' });
            const activeEntry = await QueueEntry_1.default.findOne({ queueId: queue._id, status: 'called' }).sort({ calledAt: -1 });
            return {
                ...queue.toObject(),
                waitingCount,
                servedCount,
                currentServing: activeEntry ? activeEntry.token : 'None',
            };
        }));
        return res.json(queuesWithStats);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getQueues = getQueues;
const getQueueByCode = async (req, res) => {
    const { code } = req.params;
    try {
        const queue = await Queue_1.default.findOne({ queueCode: code.toLowerCase() });
        if (!queue) {
            return res.status(404).json({ message: 'Queue not found' });
        }
        const waitingCount = await QueueEntry_1.default.countDocuments({ queueId: queue._id, status: 'waiting' });
        const currentServingEntry = await QueueEntry_1.default.findOne({ queueId: queue._id, status: 'called' }).sort({ calledAt: -1 });
        return res.json({
            ...queue.toObject(),
            waitingCount,
            currentServing: currentServingEntry ? currentServingEntry.token : 'None',
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getQueueByCode = getQueueByCode;
const deleteQueue = async (req, res) => {
    const { id } = req.params;
    try {
        const queue = await Queue_1.default.findById(id);
        if (!queue) {
            return res.status(404).json({ message: 'Queue not found' });
        }
        // Cascade delete: delete the queue and all its associated entries
        await Queue_1.default.findByIdAndDelete(id);
        await QueueEntry_1.default.deleteMany({ queueId: id });
        // Broadcast a socket event to update clients if needed, or simply return success
        const io = req.app.get('io');
        if (io) {
            // Broadcast that queue update happened so any tracking page can refresh or get notified
            io.to(id.toString()).emit('queue_updated', { queueId: id });
        }
        return res.json({ message: 'Queue and all associated entries deleted successfully', queueId: id });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.deleteQueue = deleteQueue;

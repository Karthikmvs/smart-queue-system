import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema(
  {
    queueName: { type: String, required: true },
    queueCode: { type: String, required: true, unique: true },
    averageServiceTime: { type: Number, required: true }, // in minutes
    tokenPrefix: { type: String, default: 'A' },
    lastTokenNumber: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Queue = mongoose.model('Queue', queueSchema);
export default Queue;

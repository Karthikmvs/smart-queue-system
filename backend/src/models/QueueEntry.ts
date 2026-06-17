import mongoose from 'mongoose';

const queueEntrySchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    queueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', required: true },
    token: { type: String, required: true },
    status: {
      type: String,
      enum: ['waiting', 'called', 'served', 'skipped'],
      default: 'waiting',
    },
    joinedAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    servedAt: { type: Date },
  },
  { timestamps: true }
);

export const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);
export default QueueEntry;

require('dotenv').config();
const mongoose = require('mongoose');
const QueueEntry = require('./dist/models/QueueEntry').default;

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-queue');
  console.log('Connected to DB');
  const entry = await QueueEntry.findOne().sort({ joinedAt: -1 });
  if (!entry) {
    console.log('No entries in DB');
    await mongoose.disconnect();
    return;
  }
  const queueId = entry.queueId;
  const waitingCount = await QueueEntry.countDocuments({ queueId, status: 'waiting' });
  const calledCount = await QueueEntry.countDocuments({ queueId, status: 'called' });
  const servedCount = await QueueEntry.countDocuments({ queueId, status: 'served' });
  console.log(`Latest entry token: ${entry.token}`);
  console.log(`Queue: ${queueId}`);
  console.log(`Counts -> Waiting: ${waitingCount}, Called: ${calledCount}, Served: ${servedCount}`);
  await mongoose.disconnect();
}

run().catch(console.error);

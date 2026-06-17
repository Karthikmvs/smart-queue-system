"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueEntry = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const queueEntrySchema = new mongoose_1.default.Schema({
    customerName: { type: String, required: true },
    queueId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Queue', required: true },
    token: { type: String, required: true },
    status: {
        type: String,
        enum: ['waiting', 'called', 'served', 'skipped'],
        default: 'waiting',
    },
    joinedAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    servedAt: { type: Date },
}, { timestamps: true });
exports.QueueEntry = mongoose_1.default.model('QueueEntry', queueEntrySchema);
exports.default = exports.QueueEntry;

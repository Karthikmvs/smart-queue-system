"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const queueSchema = new mongoose_1.default.Schema({
    queueName: { type: String, required: true },
    queueCode: { type: String, required: true, unique: true },
    averageServiceTime: { type: Number, required: true }, // in minutes
    tokenPrefix: { type: String, default: 'A' },
    lastTokenNumber: { type: Number, default: 0 },
}, { timestamps: true });
exports.Queue = mongoose_1.default.model('Queue', queueSchema);
exports.default = exports.Queue;

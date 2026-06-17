"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const queueController_1 = require("../controllers/queueController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/', authMiddleware_1.protect, queueController_1.createQueue);
router.get('/', authMiddleware_1.protect, queueController_1.getQueues);
router.get('/public/:code', queueController_1.getQueueByCode);
router.delete('/:id', authMiddleware_1.protect, queueController_1.deleteQueue);
exports.default = router;

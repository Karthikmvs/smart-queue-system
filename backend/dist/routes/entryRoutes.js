"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const entryController_1 = require("../controllers/entryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post('/join/:code', entryController_1.joinQueue);
router.get('/track/:token', entryController_1.getEntryByToken);
// Protected routes (Staff)
router.get('/queue/:queueId', authMiddleware_1.protect, entryController_1.getQueueEntries);
router.patch('/:id/status', authMiddleware_1.protect, entryController_1.updateEntryStatus);
router.post('/queue/:queueId/call-next', authMiddleware_1.protect, entryController_1.callNext);
exports.default = router;

import express from 'express';
import chatbotController from '../controllers/chatbotController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Ingestion now runs at startup

// Process a message - public access for demo purposes
router.post('/message', chatbotController.processMessage);

// Get connected files - public access for demo purposes
router.get('/files', chatbotController.getConnectedFiles);

export default router;
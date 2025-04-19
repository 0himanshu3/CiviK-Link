import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { getChatMessages, sendMessage, getChatParticipants } from '../controllers/chat.controller.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Get chat messages for an issue
router.get('/:issueId', getChatMessages);

// Send a new message
router.post('/:issueId', sendMessage);

// Get participants for a chat
router.get('/:issueId/participants', getChatParticipants);

export default router; 
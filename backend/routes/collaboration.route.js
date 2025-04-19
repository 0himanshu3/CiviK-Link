import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import {
    sendCollaborationRequest,
    getCollaborationRequests,
    respondToRequest
} from '../controllers/collaboration.controller.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Send collaboration request
router.post('/request', sendCollaborationRequest);

// Get collaboration requests for an NGO
router.get('/requests', getCollaborationRequests);

// Respond to collaboration request
router.patch('/request/:requestId/respond', respondToRequest);

export default router; 
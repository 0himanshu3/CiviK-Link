import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import {
    sendCollaborationRequest,
    getCollaborationRequests,
    respondToRequest,
    getPotentialCollaborators
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

// Get potential collaborators based on interests
router.get('/potential/:issueId', getPotentialCollaborators);

export default router; 
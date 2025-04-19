import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  sendCollaborationRequest,
  getCollaborationRequests,
  respondToRequest,
} from "../controllers/collaboration.controller.js";

const router = express.Router();

// Send collaboration request
router.post("/request", isAuthenticated, sendCollaborationRequest);

// Get collaboration requests for an NGO
router.get("/requests", isAuthenticated, getCollaborationRequests);

// Respond to collaboration request
router.patch("/request/:requestId/respond", isAuthenticated, respondToRequest);

export default router; 
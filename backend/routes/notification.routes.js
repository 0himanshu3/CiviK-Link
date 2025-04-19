import express from "express";
import { 
  getAllNotifications, 
  markNotificationAsRead 
} from "../controllers/notification.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get all notifications for a user
router.get("/:userId", getAllNotifications);

// Mark a notification as read
router.patch("/:notificationId/read", markNotificationAsRead);

export default router; 
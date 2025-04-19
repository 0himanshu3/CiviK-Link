import express from "express";
import {
  createEvent,
  getAllEvents,
  getEvent,
  getEventsByNGO,
  updateEvent,
  deleteEvent,
  addVolunteerPositions,
  registerForEvent,
  unregisterFromEvent,
  getUserEvents,
  updateEventStatus,
  submitEventFeedback
} from "../controllers/event.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { isNGO } from "../middlewares/role.middleware.js"; // You'll need to create this middleware

const router = express.Router();

// Event CRUD
router.post("/create", isAuthenticated, isNGO, createEvent);
router.get("/getAll", getAllEvents);

// NGO-specific routes
router.get("/ngo/:ngoId", getEventsByNGO);
router.post("/:eventId/positions", isAuthenticated, isNGO, addVolunteerPositions);
router.patch("/:eventId/status", isAuthenticated, isNGO, updateEventStatus);

// User participation
router.post("/:eventId/register", isAuthenticated, registerForEvent);
router.post("/:eventId/unregister", isAuthenticated, unregisterFromEvent);
router.get("/user/:userId?", isAuthenticated, getUserEvents);
router.post("/:eventId/feedback", isAuthenticated, submitEventFeedback);

// Single event routes (must be last)
router.get("/:eventId", getEvent);
router.put("/:eventId", isAuthenticated, updateEvent);
router.delete("/:eventId", isAuthenticated, deleteEvent);

export default router;

import Event from '../models/event.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Create a new event (NGO only)
export const createEvent = async (req, res) => {
  try {
    const { title, category, description, images, videos, eventLocation, eventStartDate, eventEndDate, volunteerPositions } = req.body;
    
    // Check if user is an NGO
    if (req.user.role !== "NGO") {
      return res.status(403).json({ message: "Only NGOs can create events" });
    }
    
    // Validate required fields
    if (!title || !category || !description || !eventLocation || !eventStartDate || !eventEndDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Validate dates
    const startDate = new Date(eventStartDate);
    const endDate = new Date(eventEndDate);
    const now = new Date();
    
    if (startDate < now) {
      return res.status(400).json({ message: "Event start date cannot be in the past" });
    }
    
    if (endDate < startDate) {
      return res.status(400).json({ message: "Event end date must be after start date" });
    }
    
    // Create the event
    const event = await Event.create({
      title,
      category,
      description,
      images: images || [],
      videos: videos || [],
      eventLocation,
      eventStartDate,
      eventEndDate,
      createdBy: req.user._id,
      volunteerPositions: volunteerPositions || []
    });
    
    return res.status(201).json(new ApiResponse(201, event, "Event created successfully"));
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all events (with optional filters)
export const getAllEvents = async (req, res) => {
  try {
    const { category, status, location, startDate, endDate } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (location) filter.eventLocation = { $regex: location, $options: 'i' };
    
    // Date filters
    if (startDate || endDate) {
      filter.eventStartDate = {};
      if (startDate) filter.eventStartDate.$gte = new Date(startDate);
      if (endDate) filter.eventEndDate = { $lte: new Date(endDate) };
    }
    
    // Get events with populated creator
    const events = await Event
      .find(filter)
      .sort({ eventStartDate: 1 }) // Sort by start date
      .populate("createdBy", "name");
    
    return res.status(200).json(new ApiResponse(200, events, "Events fetched successfully"));
  } catch (error) {
    console.error("Error in getAllEvents:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single event by ID or slug
export const getEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Try to find by ID or slug
    const event = await Event.findOne({ 
      $or: [
        { _id: eventId }, 
        { slug: eventId }
      ] 
    })
    .populate("createdBy", "name")
    .populate("volunteerPositions.registeredVolunteers", "name email");
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    return res.status(200).json(new ApiResponse(200, event, "Event fetched successfully"));
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get events created by a specific NGO
export const getEventsByNGO = async (req, res) => {
  try {
    const ngoId = req.params.ngoId || req.user._id;
    
    const events = await Event.find({ createdBy: ngoId })
      .sort({ eventStartDate: -1 });
    
    return res.status(200).json(new ApiResponse(200, events, "NGO events fetched successfully"));
  } catch (error) {
    console.error("Error fetching NGO events:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update an event (NGO only)
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if user is the creator or an admin
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }
    
    // Don't allow changing certain fields if event has registered volunteers
    const hasVolunteers = event.volunteerPositions.some(pos => pos.registeredVolunteers.length > 0);
    
    if (hasVolunteers) {
      // Remove fields that shouldn't be updated after volunteers have registered
      delete updates.eventStartDate;
      delete updates.eventEndDate;
      // You could add more restricted fields here
    }
    
    // Update the event
    Object.assign(event, updates);
    await event.save();
    
    return res.status(200).json(new ApiResponse(200, event, "Event updated successfully"));
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete an event (NGO or Admin only)
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if user is the creator or an admin
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to delete this event" });
    }
    
    // Check if event has registered volunteers
    const hasVolunteers = event.volunteerPositions.some(pos => pos.registeredVolunteers.length > 0);
    
    if (hasVolunteers && req.user.role !== "Admin") {
      return res.status(400).json({ message: "Cannot delete event with registered volunteers" });
    }
    
    // Delete the event
    await event.remove();
    
    return res.status(200).json(new ApiResponse(200, null, "Event deleted successfully"));
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add volunteer positions to an event
export const addVolunteerPositions = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { volunteerPositions } = req.body;
    
    // Validate input
    if (!volunteerPositions || !Array.isArray(volunteerPositions) || volunteerPositions.length === 0) {
      return res.status(400).json({ message: "Valid volunteer positions are required" });
    }
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if user is the creator or an admin
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }
    
    // Validate each position
    const validationErrors = [];
    volunteerPositions.forEach((pos, index) => {
      if (!pos.position || pos.position.trim() === "") {
        validationErrors.push(`Position name at index ${index} is required`);
      }
      if (!pos.slots || isNaN(pos.slots) || pos.slots <= 0) {
        validationErrors.push(`Slots at index ${index} must be a positive number`);
      }
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Validation errors", errors: validationErrors });
    }
    
    // Add the positions
    event.volunteerPositions = [...event.volunteerPositions, ...volunteerPositions];
    await event.save();
    
    return res.status(200).json(new ApiResponse(200, event, "Volunteer positions added successfully"));
  } catch (error) {
    console.error("Error adding volunteer positions:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Register as a volunteer for an event
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { positionId } = req.body;
    const userId = req.user._id;
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if event is still open for registration
    if (event.status !== "Upcoming" && event.status !== "Ongoing") {
      return res.status(400).json({ message: "Event is not open for registration" });
    }
    
    // Find the position
    const position = event.volunteerPositions.id(positionId);
    
    if (!position) {
      return res.status(404).json({ message: "Position not found" });
    }
    
    // Check if user is already registered for this position
    if (position.registeredVolunteers.includes(userId)) {
      return res.status(400).json({ message: "Already registered for this position" });
    }
    
    // Check if position has available slots
    if (position.registeredVolunteers.length >= position.slots) {
      return res.status(400).json({ message: "No slots available for this position" });
    }
    
    // Register the user
    position.registeredVolunteers.push(userId);
    await event.save();
    
    return res.status(200).json(new ApiResponse(200, event, "Registered successfully"));
  } catch (error) {
    console.error("Error registering for event:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Unregister from an event
export const unregisterFromEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { positionId } = req.body;
    const userId = req.user._id;
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if event is still upcoming (don't allow unregistering from ongoing events)
    if (event.status !== "Upcoming") {
      return res.status(400).json({ message: "Cannot unregister from events that have started" });
    }
    
    // Find the position
    const position = event.volunteerPositions.id(positionId);
    
    if (!position) {
      return res.status(404).json({ message: "Position not found" });
    }
    
    // Check if user is registered for this position
    const volunteerIndex = position.registeredVolunteers.indexOf(userId);
    if (volunteerIndex === -1) {
      return res.status(400).json({ message: "Not registered for this position" });
    }
    
    // Remove the user
    position.registeredVolunteers.splice(volunteerIndex, 1);
    await event.save();
    
    return res.status(200).json(new ApiResponse(200, event, "Unregistered successfully"));
  } catch (error) {
    console.error("Error unregistering from event:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get events a user is registered for
export const getUserEvents = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    const events = await Event.find({
      "volunteerPositions.registeredVolunteers": userId
    })
    .populate("createdBy", "name")
    .sort({ eventStartDate: 1 });
    
    return res.status(200).json(new ApiResponse(200, events, "User events fetched successfully"));
  } catch (error) {
    console.error("Error fetching user events:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update event status (NGO or Admin only)
export const updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ["Upcoming", "Ongoing", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if user is the creator or an admin
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to update this event" });
    }
    
    // Update the status
    event.status = status;
    await event.save();
    
    return res.status(200).json(new ApiResponse(200, event, "Event status updated successfully"));
  } catch (error) {
    console.error("Error updating event status:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Submit feedback for an event
export const submitEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if event is completed
    if (event.status !== "Completed") {
      return res.status(400).json({ message: "Can only submit feedback for completed events" });
    }
    
    // Check if user participated in the event
    const participated = event.volunteerPositions.some(pos => 
      pos.registeredVolunteers.includes(userId)
    );
    
    if (!participated) {
      return res.status(403).json({ message: "Only participants can submit feedback" });
    }
    
    // Check if user already submitted feedback
    const existingFeedback = event.feedback.find(f => f.user.toString() === userId.toString());
    
    if (existingFeedback) {
      return res.status(400).json({ message: "Already submitted feedback for this event" });
    }
    
    // Add the feedback
    event.feedback.push({
      user: userId,
      rating,
      comment
    });
    
    await event.save();
    
    return res.status(200).json(new ApiResponse(200, event, "Feedback submitted successfully"));
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
 
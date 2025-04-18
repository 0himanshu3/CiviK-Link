import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  createDonation,
  getUserDonations,
  getNGODonations,
  getNGOStatistics,
} from '../controllers/donation.controller.js';

const router = express.Router();

// Create a new donation (User only)
router.post('/', protect, createDonation);

// Get all donations for a user (User only)
router.get('/user', protect, getUserDonations);

// Get all donations for an NGO (NGO only)
router.get('/ngo', protect, getNGODonations);

// Get donation statistics for an NGO (NGO only)
router.get('/ngo/statistics', protect, getNGOStatistics);

export default router; 
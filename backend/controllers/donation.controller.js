import Donation from '../models/donation.model.js';
import { User } from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';

// Create a new donation
export const createDonation = async (req, res) => {
  try {
    const { ngoId, amount, message } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!ngoId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation data',
      });
    }

    // Check if NGO exists
    const ngo = await User.findOne({ _id: ngoId, role: 'NGO' });
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found',
      });
    }

    // Generate transaction ID
    const transactionId = uuidv4();

    // Create donation
    const donation = await Donation.create({
      userId,
      ngoId,
      amount,
      message,
      transactionId,
    });

    // Update NGO's total donations
    await User.findByIdAndUpdate(ngoId, {
      $inc: { totalDonations: amount },
    });

    res.status(201).json({
      success: true,
      message: 'Donation processed successfully',
      data: donation,
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process donation',
      error: error.message,
    });
  }
};

// Get all donations for a user
export const getUserDonations = async (req, res) => {
  try {
    const userId = req.user._id;

    const donations = await Donation.find({ userId })
      .populate('ngoId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations',
      error: error.message,
    });
  }
};

// Get all donations for an NGO
export const getNGODonations = async (req, res) => {
  try {
    const ngoId = req.user._id;

    const donations = await Donation.find({ ngoId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error('Error fetching NGO donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations',
      error: error.message,
    });
  }
};

// Get donation statistics for an NGO
export const getNGOStatistics = async (req, res) => {
  try {
    const ngoId = req.user._id;

    // Get total donations
    const totalDonationsResult = await Donation.aggregate([
      { $match: { ngoId: ngoId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalDonations = totalDonationsResult.length > 0 ? totalDonationsResult[0].total : 0;

    // Get total unique donors
    const totalDonorsResult = await Donation.aggregate([
      { $match: { ngoId: ngoId } },
      { $group: { _id: '$userId' } },
      { $count: 'totalDonors' }
    ]);
    const totalDonors = totalDonorsResult.length > 0 ? totalDonorsResult[0].totalDonors : 0;

    // Get recent donations
    const recentDonations = await Donation.find({ ngoId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalDonations,
        totalDonors,
        recentDonations,
      },
    });
  } catch (error) {
    console.error('Error fetching NGO statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
}; 
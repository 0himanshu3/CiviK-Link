import Stripe from 'stripe';
import Donation from '../models/donation.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
    try {
        const { amount, ngoId } = req.body;
        const userId = req.user._id;

        // Validate amount
        if (!amount || amount < 1) {
            throw new ApiError(400, "Invalid donation amount");
        }

        // Check if NGO exists
        const ngo = await User.findOne({ _id: ngoId, role: "NGO" });
        if (!ngo) {
            throw new ApiError(404, "NGO not found");
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'inr',
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId: userId.toString(),
                ngoId: ngoId
            }
        });

        return res.status(200).json(
            new ApiResponse(200, paymentIntent, "Payment intent created successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
};

export const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        const userId = req.user._id;

        // Retrieve payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            throw new ApiError(400, "Payment not successful");
        }

        // Create donation record
        const donation = await Donation.create({
            userId: userId,
            ngoId: paymentIntent.metadata.ngoId,
            amount: paymentIntent.amount / 100, // Convert back to rupees
            transactionId: paymentIntentId,
            status: 'completed'
        });

        // Update NGO's total donations
        await User.findByIdAndUpdate(
            paymentIntent.metadata.ngoId,
            { $inc: { totalDonations: paymentIntent.amount / 100 } }
        );

        return res.status(200).json(
            new ApiResponse(200, donation, "Payment confirmed and donation recorded")
        );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
};

export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const donations = await Donation.find({ userId })
            .populate('ngoId', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json(
            new ApiResponse(200, donations, "Payment history retrieved successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
}; 
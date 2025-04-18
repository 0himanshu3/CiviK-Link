import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { 
    createPaymentIntent, 
    confirmPayment, 
    getPaymentHistory 
} from '../controllers/payment.controller.js';

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Create a payment intent
router.post('/create-payment-intent', createPaymentIntent);

// Confirm payment and create donation record
router.post('/confirm-payment', confirmPayment);

// Get payment history
router.get('/history', getPaymentHistory);

export default router; 
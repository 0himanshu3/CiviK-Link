import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51RFD8dQwgk71wcjAxrrdV1QLODD2IGq6xHjR1DWV3tbr8K7TdsQU8ogktqHsflQ9LAhh2EuNgzGkDLaLBeQxjjoV00aa52wLR8');

// Payment Form Component
const PaymentForm = ({ amount, ngoId, ngoName, clientSecret, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      setProcessing(false);
      return;
    }

    try {
      // Confirm the payment with the client secret
      const { error: stripeError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: 'Donor',
            },
          },
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        navigate('/payment-cancel', { state: { errorMessage: stripeError.message } });
      } else if (confirmedPaymentIntent && confirmedPaymentIntent.status === 'succeeded') {
        // Create donation record
        await axios.post(
          'http://localhost:3000/api/v1/donations',
          {
            ngoId,
            amount: parseFloat(amount),
            paymentIntentId: confirmedPaymentIntent.id,
          },
          {
            withCredentials: true,
          }
        );

        toast.success(`Successfully donated ₹${amount} to ${ngoName}`);
        onSuccess({
          amount: parseFloat(amount),
          ngoName,
          transactionId: confirmedPaymentIntent.id,
          date: new Date().toISOString(),
        });
      }
      setProcessing(false);
    } catch (err) {
      setError('An error occurred while processing your payment.');
      toast.error('Failed to process payment');
      navigate('/payment-cancel', { state: { errorMessage: 'An error occurred while processing your payment.' } });
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="mb-4">
        <PaymentElement />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay ₹${amount}`}
      </button>
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </form>
  );
};

// Main Donation Form Component
const DonationForm = ({ ngoId, ngoName, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAmountSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount < 50) {
      toast.error('Minimum donation amount is ₹50');
      return;
    }
    setLoading(true);
    try {
      // Create payment intent on the backend
      const { data: paymentIntentResponse } = await axios.post(
        'http://localhost:3000/api/v1/payments/create-payment-intent',
        {
          amount: parseFloat(amount),
          ngoId,
        },
        {
          withCredentials: true,
        }
      );
      setClientSecret(paymentIntentResponse.data.client_secret);
      setShowPayment(true);
    } catch (err) {
      toast.error('Failed to initiate payment');
      setShowPayment(false);
      setClientSecret(null);
    }
    setLoading(false);
  };

  const elementsOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0570de',
          },
        },
      }
    : undefined;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Donate to {ngoName}</h2>
      {!showPayment ? (
        <form onSubmit={handleAmountSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Donation Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              min="50"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </form>
      ) : (
        <div>
          <button
            onClick={() => setShowPayment(false)}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back
          </button>
          {clientSecret && (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <PaymentForm
                amount={parseFloat(amount)}
                ngoId={ngoId}
                ngoName={ngoName}
                clientSecret={clientSecret}
                onSuccess={onSuccess}
              />
            </Elements>
          )}
        </div>
      )}
    </div>
  );
};

// Checklist for Google Pay visibility:
// 1. Google Pay is enabled in Stripe Dashboard (Payment Methods).
// 2. You are using the Payment Element (not CardElement).
// 3. You are using a supported browser (Chrome, Android, etc.).
// 4. Your Stripe account is set up for INR and Google Pay is supported for your country/currency.
// 5. Sometimes, Google Pay may not show on localhost or in test mode due to browser/Stripe restrictions.

export default DonationForm; 
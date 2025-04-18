import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const donationDetails = location.state?.donationDetails;

  useEffect(() => {
    // If no donation details, redirect to home
    if (!donationDetails) {
      navigate('/');
    }
  }, [donationDetails, navigate]);

  if (!donationDetails) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <FaCheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Payment Successful!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for your generous donation.
          </p>
        </div>
        
        <div className="mt-8 bg-gray-50 p-6 rounded-md">
          <h3 className="text-lg font-medium text-gray-900">Donation Details</h3>
          <dl className="mt-4 space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="text-sm text-gray-900">₹{donationDetails.amount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">NGO</dt>
              <dd className="text-sm text-gray-900">{donationDetails.ngoName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
              <dd className="text-sm text-gray-900">{donationDetails.transactionId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="text-sm text-gray-900">
                {new Date(donationDetails.date).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            to="/"
            className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 
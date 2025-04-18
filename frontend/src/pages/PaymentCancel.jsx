import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';

const PaymentCancel = () => {
  const location = useLocation();
  const errorMessage = location.state?.errorMessage || 'Your payment was cancelled or failed.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <FaTimesCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Payment Failed</h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessage}
          </p>
        </div>
        
        <div className="mt-8 bg-gray-50 p-6 rounded-md">
          <h3 className="text-lg font-medium text-gray-900">What to do next?</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check your payment details and try again</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Ensure your card has sufficient funds</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Contact your bank if the issue persists</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Try using a different payment method</span>
            </li>
          </ul>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            to="/dashboard"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaRupeeSign, FaCalendarAlt, FaUser } from 'react-icons/fa';

const NGODonations = () => {
  const [donations, setDonations] = useState([]);
  const [statistics, setStatistics] = useState({
    totalDonations: 0,
    totalDonors: 0,
    recentDonations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDonations();
    fetchStatistics();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/v1/donations/ngo', {
        withCredentials: true
      });
      setDonations(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch donations');
      toast.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/donations/ngo/statistics', {
        withCredentials: true
      });
      setStatistics(response.data.data || { totalDonations: 0, totalDonors: 0, recentDonations: [] });
    } catch (err) {
      setError('Failed to fetch statistics');
      toast.error('Failed to fetch statistics');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Donations</h1>
      
      {/* Statistics Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Donation Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaRupeeSign className="text-blue-500 text-2xl mr-2" />
              <div>
                <p className="text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold text-blue-700">₹{statistics.totalDonations}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaUser className="text-green-500 text-2xl mr-2" />
              <div>
                <p className="text-gray-600">Total Donors</p>
                <p className="text-2xl font-bold text-green-700">{statistics.totalDonors}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Donations */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
        {statistics.recentDonations.length === 0 ? (
          <p className="text-gray-600">No recent donations</p>
        ) : (
          <div className="space-y-4">
            {statistics.recentDonations.map((donation) => (
              <div key={donation._id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{donation.userId?.name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-600">
                      <FaCalendarAlt className="inline mr-1" />
                      {formatDate(donation.createdAt)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">₹{donation.amount}</p>
                </div>
                {donation.message && (
                  <p className="text-gray-600 mt-2 italic">"{donation.message}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* All Donations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">All Donations</h2>
        
        {loading && <p className="text-gray-600">Loading donations...</p>}
        {error && <p className="text-red-600">{error}</p>}
        
        {!loading && !error && donations.length === 0 && (
          <p className="text-gray-600">No donations received yet.</p>
        )}
        
        {!loading && !error && donations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donations.map((donation) => (
                  <tr key={donation._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{donation.userId?.name || 'Anonymous'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-700">₹{donation.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(donation.createdAt)}</td>
                    <td className="px-6 py-4">{donation.message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODonations; 
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import DonationForm from '../components/DonationForm';
import { useNavigate } from 'react-router-dom';
import { FaHandHoldingHeart, FaMapMarkerAlt, FaRupeeSign, FaCheckCircle, FaTimes } from 'react-icons/fa';

const Donations = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNgos();
  }, []);

  const fetchNgos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/v1/auth/ngos', {
        withCredentials: true
      });
      setNgos(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch NGOs');
      toast.error('Failed to fetch NGOs');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = (ngo) => {
    setSelectedNgo(ngo);
    setShowDonationModal(true);
  };

  const handleDonationSuccess = (donationDetails) => {
    setShowDonationModal(false);
    setSelectedNgo(null);
    fetchNgos(); 
    navigate('/payment-success', { state: { donationDetails } });
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-blue-800 mb-2 tracking-tight">Support NGOs</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Your donations help NGOs continue their important work in the community and make a lasting impact.</p>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <FaTimes className="text-red-500 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {!loading && !error && ngos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <FaHandHoldingHeart className="text-gray-300 text-5xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No NGOs found at the moment.</p>
          </div>
        )}
        
        {!loading && !error && ngos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ngos.map((ngo) => (
              <div key={ngo._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-blue-800 mb-3">{ngo.name}</h2>
                  <div className="flex items-center text-gray-500">
                    <FaMapMarkerAlt className="mr-2 text-blue-400" />
                    <span>{ngo.location}</span>
                  </div>
                  
                  <p className="text-gray-600 h-20 overflow-y-auto">
                    {ngo.description || 'No description available'}
                  </p>
                  
                  <div className="flex justify-between mb-4 bg-blue-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-blue-500 mb-1">
                        <FaRupeeSign />
                      </div>
                      <p className="text-xl font-bold text-blue-700">₹{ngo.totalDonations || 0}</p>
                      <p className="text-xs text-gray-500">Total Donations</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center text-green-500 mb-1">
                        <FaCheckCircle />
                      </div>
                      <p className="text-xl font-bold text-green-700">{ngo.issuesResolved || 0}</p>
                      <p className="text-xs text-gray-500">Issues Resolved</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDonate(ngo)}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200 font-medium flex items-center justify-center"
                  >
                    <FaHandHoldingHeart className="mr-2" />
                    Donate Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Donation Modal */}
        {showDonationModal && selectedNgo && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md relative shadow-2xl animate-fadeIn">
              <button
                onClick={() => {
                  setShowDonationModal(false);
                  setSelectedNgo(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="text-center mb-6">
                <FaHandHoldingHeart className="text-blue-500 text-3xl mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-800">Donate to {selectedNgo.name}</h3>
                <p className="text-gray-500 text-sm mt-1">Your contribution makes a difference</p>
              </div>
              
              <DonationForm 
                ngoId={selectedNgo._id} 
                ngoName={selectedNgo.name}
                onSuccess={handleDonationSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Donations;

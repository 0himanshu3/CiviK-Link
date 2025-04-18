import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import DonationForm from '../components/DonationForm';
import { useNavigate } from 'react-router-dom';

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
      const response = await axios.get('http://localhost:3000/api/v1/user/ngos', {
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
    fetchNgos(); // Refresh NGO list to update donation amounts
    navigate('/payment-success', { state: { donationDetails } });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Support NGOs</h1>
      
      {loading && <p className="text-gray-600">Loading NGOs...</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!loading && !error && ngos.length === 0 && (
        <p className="text-gray-600">No NGOs found.</p>
      )}
      
      {!loading && !error && ngos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ngos.map((ngo) => (
            <div key={ngo._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-blue-800 mb-2">{ngo.name}</h2>
                <p className="text-gray-600 mb-2">{ngo.description || 'No description available'}</p>
                <p className="text-gray-500 text-sm mb-4">Location: {ngo.location}</p>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Total Donations: ₹{ngo.totalDonations || 0}</p>
                  <p className="text-sm text-gray-500">Issues Resolved: {ngo.issuesResolved || 0}</p>
                </div>
                
                <button
                  onClick={() => handleDonate(ngo)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                >
                  Donate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Donation Modal */}
      {showDonationModal && selectedNgo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <button
              onClick={() => {
                setShowDonationModal(false);
                setSelectedNgo(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <DonationForm 
              ngoId={selectedNgo._id} 
              ngoName={selectedNgo.name}
              onSuccess={handleDonationSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations; 
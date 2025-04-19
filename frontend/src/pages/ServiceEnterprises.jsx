import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Mail, Building2, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServiceEnterprises = () => {
  const navigate = useNavigate();
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/auth/ngos');
        if (response.data.success) {
          setNgos(response.data.data);
        } else {
          setError('Failed to fetch NGOs data');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch NGOs. Please try again later.');
        setLoading(false);
      }
    };

    fetchNgos();
  }, []);

  const filteredNgos = ngos.filter(ngo => 
    ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ngo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ngo.location && ngo.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Explore Service Enterprises</h1>
        <p className="text-gray-600">Discover and connect with NGOs making a difference in your community</p>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search by name, email, or location..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* NGOs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNgos.map((ngo) => (
          <div key={ngo._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Building2 className="w-8 h-8 text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">{ngo.name}</h2>
              </div>
              
              <div className="space-y-3">
                {ngo.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{ngo.location}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{ngo.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>Total Donations: ₹{ngo.totalDonations.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                  onClick={() => navigate(`/dashboard/ngo-details/${ngo._id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNgos.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No NGOs found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default ServiceEnterprises; 
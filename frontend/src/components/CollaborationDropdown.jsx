import React, { useState, useEffect } from 'react';
import { sendCollaborationRequest } from '../services/collaboration.service';
import { toast } from 'react-hot-toast';

const issueTags = ["Road", "Water", "Electricity", "Education", "Health", "Sanitation"];

const CollaborationDropdown = ({ issueId, assignedNgoId }) => {
  const [ngos, setNgos] = useState([]);
  const [selectedNgos, setSelectedNgos] = useState([]);
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [showAllNgos, setShowAllNgos] = useState(false);

  // Fetch potential collaborators based on interests
  useEffect(() => {
    const fetchNgos = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/collaboration/potential/${issueId}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch NGOs');
        }
        const data = await response.json();
        // Filter out the currently assigned NGO
        const filteredNgos = data.data.filter(ngo => ngo._id !== assignedNgoId);
        setNgos(filteredNgos);
      } catch (error) {
        console.error('Error fetching NGOs:', error);
        toast.error('Failed to load NGOs');
      }
    };

    if (issueId) {
      fetchNgos();
    }
  }, [issueId, assignedNgoId]);

  const handleNgoSelect = (ngoId) => {
    setSelectedNgos(prev => {
      if (prev.includes(ngoId)) {
        return prev.filter(id => id !== ngoId);
      }
      return [...prev, ngoId];
    });
  };

  const handleInterestChange = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      return [...prev, interest];
    });
  };

  const filteredNgos = ngos.filter(ngo => {
    if (showAllNgos) return true;
    if (selectedInterests.length === 0) return true;
    return ngo.interests.some(interest => selectedInterests.includes(interest));
  });

  const handleSubmit = async () => {
    if (selectedNgos.length === 0) {
      toast.error('Please select at least one NGO');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      // Send requests to all selected NGOs
      await Promise.all(
        selectedNgos.map(ngoId =>
          sendCollaborationRequest(issueId, ngoId, message)
        )
      );
      toast.success('Collaboration requests sent successfully');
      setIsOpen(false);
      setSelectedNgos([]);
      setMessage('');
    } catch (error) {
      toast.error(error.message || 'Failed to send collaboration requests');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
      >
        Add Collaborators
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg z-50 p-4">
          <h3 className="text-lg font-semibold mb-3">Select NGOs to Collaborate</h3>
          
          {/* Interest Filters */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Filter by Interests</label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showAllNgos}
                  onChange={() => setShowAllNgos(!showAllNgos)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show All NGOs</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {issueTags.map((tag) => (
                <label key={tag} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedInterests.includes(tag)}
                    onChange={() => handleInterestChange(tag)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{tag}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto mb-3">
            {filteredNgos.map(ngo => (
              <div key={ngo._id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={ngo._id}
                  checked={selectedNgos.includes(ngo._id)}
                  onChange={() => handleNgoSelect(ngo._id)}
                  className="mr-2"
                />
                <label htmlFor={ngo._id} className="flex flex-col">
                  <span>{ngo.name}</span>
                  <span className="text-xs text-gray-500">
                    Interests: {ngo.interests.join(', ')}
                  </span>
                </label>
              </div>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to the NGOs..."
            className="w-full p-2 border rounded-md mb-3"
            rows="3"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Requests'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationDropdown; 
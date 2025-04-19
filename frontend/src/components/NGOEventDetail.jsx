import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HiChevronDown, HiChevronUp, HiUserGroup, HiLocationMarker, HiStatusOnline, HiX } from "react-icons/hi";

export default function NGOEventDetail({ event: initialEvent }) {
  const [event, setEvent] = useState(initialEvent);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volunteerPositions, setVolunteerPositions] = useState([{ position: '', slots: '' }]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState(event.status);
  const { user } = useSelector((state) => state.auth);
  const [errors, setErrors] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // State for managing expanded sections
  const [expandedPositions, setExpandedPositions] = useState({});
  const [expandedVolunteers, setExpandedVolunteers] = useState({});
  
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowVolunteerModal(false);
        setShowStatusModal(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Image navigation functions
  const handleNext = () => {
    if (currentIndex < event.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Toggle functions for expanding/collapsing positions and volunteers
  const togglePosition = (positionId) => {
    setExpandedPositions(prev => ({
      ...prev,
      [positionId]: !prev[positionId]
    }));
  };

  const toggleVolunteer = (volunteerId) => {
    setExpandedVolunteers(prev => ({
      ...prev,
      [volunteerId]: !prev[volunteerId]
    }));
  };

  // Modal handlers
  const handleAddPosition = () => {
    setVolunteerPositions([...volunteerPositions, { position: '', slots: '' }]);
  };

  const handlePositionChange = (index, field, value) => {
    const updatedPositions = [...volunteerPositions];
    updatedPositions[index][field] = value;
    setVolunteerPositions(updatedPositions);
  };

  const handleRemovePosition = (index) => {
    const updatedPositions = volunteerPositions.filter((_, i) => i !== index);
    setVolunteerPositions(updatedPositions);
  };

  const handleSubmitVolunteerRequest = async () => {
    let currentErrors = {};
    volunteerPositions.forEach((pos, index) => {
      if (!pos.position.trim()) {
        currentErrors[`position_${index}`] = 'Position name is required';
      }
      if (!pos.slots || isNaN(pos.slots) || pos.slots <= 0) {
        currentErrors[`slots_${index}`] = 'Please enter a valid number of slots';
      }
    });

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }
    setErrors({});

    try {
      const res = await fetch(`http://localhost:3000/api/v1/events/${event._id}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ volunteerPositions }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add positions");
      }
      
      const data = await res.json();
      setEvent(data.data);
      toast.success('Volunteer positions added successfully!');
      setShowVolunteerModal(false);
      setVolunteerPositions([{ position: '', slots: '' }]);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while adding volunteer positions.');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/events/${event._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update status");
      }
      
      const data = await res.json();
      setEvent(data.data);
      toast.success('Event status updated successfully!');
      setShowStatusModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while updating event status.');
    }
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    return dayjs(dateString).format('MMM D, YYYY h:mm A');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
              <button
                onClick={() => setShowStatusModal(true)}
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  event.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                  event.status === 'Ongoing' ? 'bg-green-100 text-green-700' :
                  event.status === 'Completed' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }`}
              >
                {event.status}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center text-gray-600">
                <HiLocationMarker className="mr-2 h-5 w-5 text-blue-500" />
                <span>{event.eventLocation}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <HiStatusOnline className="mr-2 h-5 w-5 text-blue-500" />
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  {event.category}
                </span>
              </div>
            </div>
            
            <div className="mb-4 text-gray-600">
              <div><strong>Start:</strong> {formatDateTime(event.eventStartDate)}</div>
              <div><strong>End:</strong> {formatDateTime(event.eventEndDate)}</div>
            </div>
            
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.description }}></div>
          </div>
          
          {/* Event Images */}
          {event.images && event.images.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-3">Images</h2>
                <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                  <img
                    src={event.images[currentIndex].url}
                    alt={event.images[currentIndex].caption || 'Event Image'}
                    className="mx-auto rounded"
                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                  />
                  {event.images.length > 1 && (
                    <>
                      <button
                        className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white"
                        onClick={handlePrevious}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white"
                        onClick={handleNext}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  )}
                  {event.images[currentIndex].caption && (
                    <p className="text-sm text-gray-600 mt-2 text-center italic">{event.images[currentIndex].caption}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Volunteer Positions Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <HiUserGroup className="h-6 w-6 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Volunteer Positions</h2>
            </div>
            
            {event.volunteerPositions && event.volunteerPositions.length > 0 ? (
              <div className="space-y-4">
                {event.volunteerPositions.map((position, idx) => (
                  <div key={position._id || idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Position Header */}
                    <div 
                      className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => togglePosition(position._id || `pos-${idx}`)}
                    >
                      <div className="font-medium text-gray-800">{position.position}</div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">
                          {position.registeredVolunteers?.length || 0}/{position.slots} volunteers
                        </span>
                        {expandedPositions[position._id || `pos-${idx}`] ? 
                          <HiChevronUp className="h-5 w-5" /> : 
                          <HiChevronDown className="h-5 w-5" />
                        }
                      </div>
                    </div>
                    
                    {/* Expanded Position Content */}
                    {expandedPositions[position._id || `pos-${idx}`] && (
                      <div className="p-4 bg-white">
                        {/* Volunteer List */}
                        {position.registeredVolunteers && position.registeredVolunteers.length > 0 ? (
                          <div className="space-y-3">
                            <h3 className="font-medium text-gray-700 border-b pb-2">Registered Volunteers</h3>
                            
                            {position.registeredVolunteers.map((volunteer, vIdx) => (
                              <div key={volunteer._id || `vol-${vIdx}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                {/* Volunteer Header */}
                                <div 
                                  className="flex justify-between items-center cursor-pointer"
                                  onClick={() => toggleVolunteer(volunteer._id || `vol-${vIdx}`)}
                                >
                                  <div className="font-medium text-blue-600">
                                    {volunteer.name || `Volunteer #${vIdx+1}`} 
                                    {volunteer.email && <span className="ml-2 text-sm text-gray-500">({volunteer.email})</span>}
                                  </div>
                                  {expandedVolunteers[volunteer._id || `vol-${vIdx}`] ? 
                                    <HiChevronUp className="h-5 w-5 text-gray-500" /> : 
                                    <HiChevronDown className="h-5 w-5 text-gray-500" />
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">No volunteers have registered for this position yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No volunteer positions have been created yet.</p>
            )}
            
            {/* Request Volunteers Button */}
            <div className="mt-6">
              <button
                onClick={() => setShowVolunteerModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <HiUserGroup className="mr-2 h-5 w-5" />
                Add Volunteer Positions
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link 
            to="/ngo-dashboard/created-events"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg shadow"
          >
            Back to Events
          </Link>
          
          <Link 
            to={`/ngo-dashboard/events/${event._id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
          >
            Edit Event
          </Link>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Update Event Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end items-center gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Request Modal */}
      {showVolunteerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Volunteer Positions</h3>
            
            {/* Scrollable content area */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {volunteerPositions.map((position, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position Name</label>
                    <input
                      type="text"
                      value={position.position}
                      onChange={(e) => handlePositionChange(index, 'position', e.target.value)}
                      className={`w-full px-3 py-2 border ${errors[`position_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., Coordinator, Field Worker"
                    />
                    {errors[`position_${index}`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`position_${index}`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Slots</label>
                    <input
                      type="number"
                      value={position.slots}
                      onChange={(e) => handlePositionChange(index, 'slots', e.target.value)}
                      className={`w-full px-3 py-2 border ${errors[`slots_${index}`] ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., 5"
                    />
                    {errors[`slots_${index}`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`slots_${index}`]}</p>
                    )}
                  </div>
                  
                  {volunteerPositions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePosition(index)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Position
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={handleAddPosition}
              className="w-full mt-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors font-medium"
            >
              + Add Another Position
            </button>
            
            <div className="flex justify-end items-center gap-3 mt-6">
              <button
                onClick={() => setShowVolunteerModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitVolunteerRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Positions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add some custom scrollbar styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

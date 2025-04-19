import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UserEventDetails({ event: initialEvent }) {
  const [event, setEvent] = useState(initialEvent);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

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

  const openRegisterModal = (position) => {
    setSelectedPosition(position);
    setShowRegisterModal(true);
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error("Please log in to register for this event");
      navigate("/login");
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/events/${event._id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ positionId: selectedPosition._id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to register");
      }

      const updatedEvent = await response.json();
      setEvent(updatedEvent.data);
      toast.success("Successfully registered as a volunteer!");
      setShowRegisterModal(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Check if user is registered for any position
  const isUserRegistered = event.volunteerPositions?.some(position => 
    position.registeredVolunteers?.includes(user?._id)
  );

  // Format date with time
  const formatDateTime = (dateString) => {
    return dayjs(dateString).format('MMM D, YYYY h:mm A');
  };

  // Get status with appropriate styling
  const getStatusBadge = () => {
    const statusClasses = {
      'Upcoming': 'bg-blue-100 text-blue-700',
      'Ongoing': 'bg-green-100 text-green-700',
      'Completed': 'bg-gray-100 text-gray-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    
    return (
      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusClasses[event.status] || 'bg-yellow-100 text-yellow-700'}`}>
        {event.status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">{event.title}</h1>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center">
            <span className="font-semibold text-gray-800 mr-2">Status:</span>
            {getStatusBadge()}
          </div>
          
          <div className="flex items-center">
            <span className="font-semibold text-gray-800 mr-2">Category:</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              {event.category}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <span className="font-semibold text-gray-800">Location:</span>
            <p className="mt-1">{event.eventLocation}</p>
          </div>
          
          <div>
            <span className="font-semibold text-gray-800">Date & Time:</span>
            <div className="mt-1 text-gray-600">
              <div>Start: {formatDateTime(event.eventStartDate)}</div>
              <div>End: {formatDateTime(event.eventEndDate)}</div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <span className="font-semibold text-gray-800">Description:</span>
          <div className="mt-2 prose max-w-none" dangerouslySetInnerHTML={{ __html: event.description }}></div>
        </div>

        {event.images && event.images.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Images</h2>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={event.images[currentIndex].url}
                alt={event.images[currentIndex].caption || `Event image ${currentIndex + 1}`}
                className="mx-auto rounded"
                style={{
                  height: '300px',
                  objectFit: 'contain',
                }}
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
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {event.images[currentIndex].caption}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Organized by</h2>
          <div className="flex items-center">
            <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-medium">{event.createdBy?.name || "NGO Organization"}</p>
            </div>
          </div>
        </div>

        {/* Volunteer Positions */}
        {event.volunteerPositions && event.volunteerPositions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Volunteer Positions</h2>
            <div className="space-y-3">
              {event.volunteerPositions.map((position, idx) => {
                const isPositionFull = position.registeredVolunteers?.length >= position.slots;
                const isUserRegisteredForPosition = position.registeredVolunteers?.includes(user?._id);
                
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-lg">{position.position}</h3>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {position.registeredVolunteers?.length || 0}/{position.slots} volunteers
                      </span>
                    </div>
                    
                    {event.status === 'Upcoming' && (
                      <div className="mt-3">
                        {isUserRegisteredForPosition ? (
                          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm inline-block">
                            You are registered for this position
                          </div>
                        ) : isUserRegistered ? (
                          <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm inline-block">
                            You are already registered for another position in this event
                          </div>
                        ) : !isPositionFull && (
                          <button
                            onClick={() => openRegisterModal(position)}
                            className="px-4 py-2 rounded-lg text-sm bg-green-600 hover:bg-green-700 text-white"
                          >
                            Register as Volunteer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-8">
          <Link 
            to="/events"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg shadow"
          >
            Back to Events
          </Link>
          
          {isUserRegistered && event.status !== 'Completed' && (
            <Link 
              to="/dashboard/my-events"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
            >
              View My Registrations
            </Link>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg">
            <h3 className="text-xl font-bold mb-4">Register as Volunteer</h3>
            
            <div className="mb-4">
              <p className="font-medium">Event: {event.title}</p>
              <p className="text-gray-600">Position: {selectedPosition.position}</p>
              <p className="text-gray-600">Available Slots: {selectedPosition.slots - (selectedPosition.registeredVolunteers?.length || 0)}</p>
            </div>
            
            <p className="mb-4 text-gray-700">
              By registering, you commit to attend this event and fulfill the responsibilities of this volunteer position.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setShowRegisterModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? "Registering..." : "Confirm Registration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

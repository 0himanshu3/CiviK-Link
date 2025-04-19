import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EventDetail({ event: initialEvent }) {
  const [event, setEvent] = useState(initialEvent);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useSelector((state) => state.auth);
  
  const isNGO = user?.role === 'NGO';
  const isEventCreator = user?._id === event.createdBy;

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

  const getStatusClass = (status) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'Ongoing':
        return 'bg-green-100 text-green-700';
      case 'Completed':
        return 'bg-gray-100 text-gray-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">{event.title}</h1>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center">
            <span className="font-semibold text-gray-800 mr-2">Status:</span>
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(event.status)}`}
            >
              {event.status}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="font-semibold text-gray-800 mr-2">Category:</span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              {event.category}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <span className="font-semibold text-gray-800">Location:</span> {event.eventLocation}
        </div>
        
        <div className="mb-4">
          <span className="font-semibold text-gray-800">Date & Time:</span>
          <div className="mt-1 text-gray-600">
            <div>Start: {dayjs(event.eventStartDate).format('MMM D, YYYY h:mm A')}</div>
            <div>End: {dayjs(event.eventEndDate).format('MMM D, YYYY h:mm A')}</div>
          </div>
        </div>
        
        <div className="mb-6">
          <span className="font-semibold text-gray-800">Description:</span>
          <div className="mt-2 prose max-w-none" dangerouslySetInnerHTML={{ __html: event.description }}></div>
        </div>

        {event.images && event.images.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Images</h2>
            <div className="relative">
              <img
                src={event.images[currentIndex].url}
                alt={event.images[currentIndex].caption || `Event image ${currentIndex + 1}`}
                className="rounded-lg shadow w-full"
                style={{
                  height: '300px',
                  objectFit: 'contain',
                  width: '100%',
                }}
              />
              {event.images.length > 1 && (
                <>
                  <div
                    className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-500 bg-opacity-50 p-2 cursor-pointer"
                    onClick={handlePrevious}
                  >
                    <span className="text-white text-lg">←</span>
                  </div>
                  <div
                    className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-500 bg-opacity-50 p-2 cursor-pointer"
                    onClick={handleNext}
                  >
                    <span className="text-white text-lg">→</span>
                  </div>
                </>
              )}
              {event.images[currentIndex].caption && (
                <p className="text-sm text-gray-600 mt-1 text-center">
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
              {event.volunteerPositions.map((position, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">{position.position}</h3>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {position.registeredVolunteers?.length || 0}/{position.slots} volunteers
                    </span>
                  </div>
                  
                  {!isNGO && event.status === 'Upcoming' && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          // Registration logic would go here
                          toast.info("Registration functionality would be implemented here");
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                        disabled={position.registeredVolunteers?.length >= position.slots}
                      >
                        {position.registeredVolunteers?.length >= position.slots 
                          ? "No Slots Available" 
                          : "Register as Volunteer"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-8">
          {isEventCreator && (
            <Link 
              to={`/dashboard/events/${event._id}/manage`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
            >
              Manage Event
            </Link>
          )}
          
          <Link 
            to="/events"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg shadow"
          >
            Back to Events
          </Link>
        </div>
      </div>
    </div>
  );
}

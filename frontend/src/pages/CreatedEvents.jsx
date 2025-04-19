import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { HiCalendar, HiLocationMarker, HiUserGroup, HiPencil, HiTrash } from 'react-icons/hi';

export default function CreatedEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/v1/events/ngo/${user._id}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setEvents(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/v1/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Error ${response.status}`);
      }

      toast.success('Event deleted successfully');
      // Remove the deleted event from the state
      setEvents(events.filter(event => event._id !== eventId));
    } catch (error) {
      toast.error(`Failed to delete event: ${error.message}`);
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Created Events</h2>
        <Link
          to="/ngo-dashboard/create-event"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Event
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No events created yet</h3>
          <p className="text-gray-500 mb-4">Start creating events to engage volunteers in your community.</p>
          <Link
            to="/ngo-dashboard/create-event"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <div key={event._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Event Image */}
              <div className="h-40 bg-gray-200 relative">
                {event.images && event.images.length > 0 ? (
                  <img 
                    src={event.images[0].url} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>
              
              {/* Event Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
                
                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <HiCalendar className="mr-2 h-4 w-4 text-blue-500" />
                    <span>{dayjs(event.eventStartDate).format('MMM D, YYYY')}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <HiLocationMarker className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="line-clamp-1">{event.eventLocation}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <HiUserGroup className="mr-2 h-4 w-4 text-blue-500" />
                    <span>
                      {event.volunteerPositions?.reduce((total, pos) => {
                        const registered = pos.registeredVolunteers?.length || 0;
                        const slots = pos.slots || 0;
                        return total + registered;
                      }, 0) || 0} / {event.volunteerPositions?.reduce((total, pos) => total + (pos.slots || 0), 0) || 0} volunteers
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <Link
                    to={`/events/${event._id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </Link>
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/ngo-dashboard/events/${event._id}/edit`}
                      className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <HiPencil className="h-5 w-5" />
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <HiTrash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

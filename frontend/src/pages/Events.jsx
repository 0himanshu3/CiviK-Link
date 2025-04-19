import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { HiLocationMarker, HiCalendar, HiUserGroup } from "react-icons/hi";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    location: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.location) queryParams.append('location', filters.location);
      
      const response = await fetch(`http://localhost:3000/api/v1/events/getAll?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchEvents();
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      status: '',
      location: '',
    });
    // Fetch all events after reset
    setTimeout(fetchEvents, 0);
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Community Events</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Blood Donation">Blood Donation</option>
                <option value="Health Camp">Health Camp</option>
                <option value="Education">Education</option>
                <option value="Environment">Environment</option>
                <option value="Food Distribution">Food Distribution</option>
                <option value="Fundraising">Fundraising</option>
                <option value="Awareness">Awareness</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Enter location..."
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        
        {/* Events List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No events found</h2>
            <p className="text-gray-500">Try adjusting your filters or check back later for new events.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link 
                key={event._id} 
                to={`/events/${event._id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Event Image */}
                <div className="h-48 bg-gray-200 relative">
                  {event.images && event.images.length > 0 ? (
                    <img 
                      src={event.images[0].url} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">{event.title}</h2>
                  
                  <div className="space-y-2 text-sm text-gray-600">
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
                        {event.volunteerPositions?.reduce((total, pos) => total + (pos.slots || 0), 0) || 0} volunteer slots
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                      {event.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

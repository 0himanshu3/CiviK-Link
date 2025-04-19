import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import EventDetail from './EventDetail';
import NGOEventDetail from './NGOEventDetail';
import UserEventDetail from './UserEventDetail';

export default function EventDetailsWrapper() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/events/${id}`, {
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
        setEvent(data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-6">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || "Event not found"}</p>
        </div>
      </div>
    );
  }

  // Determine which component to render based on user role
  if (!user) {
    // Not logged in - show general event details
    return <EventDetail event={event} />;
  } else if (user.role === 'NGO' && event.createdBy?._id === user._id) {
    // NGO viewing their own event
    return <NGOEventDetail event={event} />;
  } else {
    // Regular user or NGO viewing someone else's event
    return <UserEventDetail event={event} />;
  }
}

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/v1/notifications/${user._id}`);
        setNotifications(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user._id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(`http://localhost:3000/api/v1/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 shadow-lg rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-blue-700">Notifications</h1>
          </div>
          <div className="flex items-center space-x-4">
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded">
              <span className="font-semibold">{notifications.length}</span> notifications
            </div>
          </div>
        </div>
  
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded border border-dashed border-gray-300">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-white shadow">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="mt-4 text-gray-700 text-lg font-medium">No notifications yet</p>
              <p className="text-gray-400 mt-1 text-sm">We’ll notify you when there’s something new.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`rounded-lg border border-gray-200 p-5 bg-white shadow-sm hover:shadow-md transition ${
                  !n.isRead ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{n.message}</p>
                    <div className="flex items-center mt-2 gap-4 text-sm text-gray-500">
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      {!n.isRead && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
  
} 
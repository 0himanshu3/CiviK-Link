import React, { useState, useEffect } from 'react';
import { getCollaborationRequests, respondToRequest } from '../services/collaboration.service';
import { toast } from 'react-toastify';

const CollaborationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCollaborationRequests();
      // Ensure data is an array and has the expected structure
      const validRequests = Array.isArray(data) ? data.filter(request => 
        request && request._id && request.issueId && request.requestedBy
      ) : [];
      setRequests(validRequests);
    } catch (err) {
      setError(err.message || 'Failed to fetch collaboration requests');
      toast.error(err.message || 'Failed to fetch collaboration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, action) => {
    try {
      setProcessingRequest(requestId);
      // Convert action to the correct status format
      const status = action === 'accept' ? 'accepted' : 'rejected';
      await respondToRequest(requestId, status);
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId 
            ? { ...request, status } 
            : request
        )
      );

      toast.success(`Request ${status} successfully`);
    } catch (err) {
      toast.error(err.message || `Failed to ${action} request`);
    } finally {
      setProcessingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        No collaboration requests found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request._id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">
                {request.issueId?.title || 'Untitled Issue'}
              </h3>
              <p className="text-gray-600 mt-1">
                {request.message || 'No message provided'}
              </p>
              <div className="mt-2 text-sm text-gray-500">
                From: {request.requestedBy?.name || 'Unknown User'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {request.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleResponse(request._id, 'accept')}
                    disabled={processingRequest === request._id}
                    className={`px-4 py-2 rounded ${
                      processingRequest === request._id
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {processingRequest === request._id ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleResponse(request._id, 'reject')}
                    disabled={processingRequest === request._id}
                    className={`px-4 py-2 rounded ${
                      processingRequest === request._id
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {processingRequest === request._id ? 'Processing...' : 'Reject'}
                  </button>
                </>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  request.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollaborationRequests; 
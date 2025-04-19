import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaCalendarAlt
} from 'react-icons/fa';

const NGOCLaimedIssues = () => {
  const { ngoId } = useParams();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch claimed issues
        const ngoResponse = await axios.get(`http://localhost:3000/api/v1/issues/claimed/${ngoId}`);
        if (ngoResponse.data.success) {
          const claimedIssues = ngoResponse.data.claimedIssues;
          const completedIssues = claimedIssues.filter(issue => issue.status === 'Completed');
          setIssues(completedIssues);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ngoId]);

  const getStatusIcon = (status) => {
    if (!status) return <FaExclamationCircle className="text-gray-500" />;
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'in progress':
        return <FaClock className="text-yellow-500" />;
      default:
        return <FaExclamationCircle className="text-red-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
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
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/ngo/${ngoId}`)}
          className="flex items-center text-blue-500 hover:text-blue-600 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to NGO Profile
        </button>
        <h1 className="text-3xl font-semibold mb-2">
          Completed Issues
        </h1>
        <p className="text-gray-600">
          Total Issues: {issues.length}
        </p>
      </div>

      {/* Issues List */}
      <div className="grid gap-6">
        {issues.length > 0 ? (
          issues.map((issue) => (
            <div
              key={issue._id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{issue.title}</h2>
                  <p className="text-gray-600 mb-4">{issue.content}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(issue.status)}
                  <span className="font-medium capitalize">{issue.status || 'Unknown'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2" />
                  {issue.issueLocation || 'Location not specified'}
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  Created: {formatDate(issue.createdAt)}
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  Deadline: {formatDate(issue.deadline)}
                </div>
              </div>

              {issue.images && issue.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {issue.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`Issue ${index + 1}`}
                      className="rounded-lg w-full h-32 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No claimed issues found.
          </div>
        )}
      </div>
    </div>
  );
};

export default NGOCLaimedIssues;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaHandHoldingHeart,
  FaUsers,
  FaChartLine,
  FaCheckCircle,
  FaTasks,
  FaArrowRight,
} from 'react-icons/fa';

const NGODetails = () => {
  const navigate = useNavigate();
  const { ngoId } = useParams();
  const [ngoInfo, setNgoInfo] = useState(null);
  const [statistics, setStatistics] = useState({
    totalIssuesResolved: 0,
    activeVolunteers: 0,
    totalDonations: 0,
    completionRate: 0
  });
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNGOData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch NGO info
        const ngoResponse = await axios.get(`http://localhost:3000/api/v1/auth/${ngoId}`);
        if (ngoResponse.data.success) {
          const ngoData = ngoResponse.data.data;
          setNgoInfo(ngoData);
          
          // Set total donations from NGO data
          setStatistics(prev => ({
            ...prev,
            totalDonations: ngoData.totalDonations || 0
          }));
        } else {
          setError('Failed to fetch NGO information');
          return;
        }

        // Fetch issues claimed by this NGO
        const issueRequestsResponse = await axios.get(`http://localhost:3000/api/v1/issue-request/${ngoId}`);
        const issueRequests = issueRequestsResponse.data;

        // Fetch details for each claimed issue
        const claimedIssues = [];
        for (const issueId of issueRequests) {
          try {
            const issueResponse = await axios.get(`http://localhost:3000/api/v1/issues/getIssue/${issueId}`);
            if (issueResponse.data.success) {
              claimedIssues.push(issueResponse.data.data);
            }
          } catch (error) {
            console.error(`Error fetching issue with ID: ${issueId}`, error);
          }
        }
        // Calculate statistics
        const flattenedIssues = claimedIssues.flat();
        const completedIssues = flattenedIssues.filter(issue => issue.status === 'Completed');
        console.log(completedIssues);
        const onTimeCompletedIssues = completedIssues.filter(issue => {
          if (!issue.deadline) return false;
          const completionDate = new Date(issue.updatedAt);
          const deadline = new Date(issue.deadline);
          return completionDate <= deadline;
        });

        // Get active volunteers
        

        const activeVolunteersSet = new Set();
        flattenedIssues.forEach(issue => {
          issue.volunteerPositions?.forEach(position => {
            position.registeredVolunteers?.forEach(volunteerId => {
              activeVolunteersSet.add(volunteerId);
            });
          });
        });
        
        // Update statistics
        setStatistics(prev => ({
          ...prev,
          totalIssuesResolved: completedIssues.length,
          activeVolunteers: activeVolunteersSet.size,
          completionRate: claimedIssues.length > 0 
            ? Math.round((onTimeCompletedIssues.length / claimedIssues.length) * 100) 
            : 0
        }));

        // Helper function to safely parse dates
        const parseDate = (dateString) => {
          if (!dateString) return null;
          const date = new Date(dateString);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        };

        // Set assigned issues
        setAssignedIssues(
          flattenedIssues.map(issue => ({
            id: issue._id,
            title: issue.title,
            location: issue.issueLocation,
            status: (issue.status || 'unknown').toLowerCase(),
            startDate: parseDate(issue.createdAt),
            deadline: parseDate(issue.deadline),
            progress:
              issue.status === 'Completed' ? 100 :
              issue.status === 'Assigned' ? 50 : 0,
            media: issue.images?.map(img => img.url) || [],
            description: issue.content
          }))
        );

      } catch (error) {
        console.error('Error fetching NGO data:', error);
        setError('Failed to fetch NGO data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNGOData();
  }, [ngoId]);

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

  if (!ngoInfo) {
    return (
      <div className="text-center text-red-500 p-4">
        NGO not found
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* NGO Header */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-semibold mb-2">{ngoInfo.name}</h1>
        <p className="text-gray-600">{ngoInfo.location || 'Location not specified'}</p>
        <p className="text-gray-600 mt-2">{ngoInfo.email}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-gray-500">Issues Resolved</p>
            <h3 className="text-2xl font-bold">{statistics.totalIssuesResolved}</h3>
          </div>
          <FaHandHoldingHeart className="text-blue-500 text-3xl" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-gray-500">Active Volunteers</p>
            <h3 className="text-2xl font-bold">{statistics.activeVolunteers}</h3>
          </div>
          <FaUsers className="text-green-500 text-3xl" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-gray-500">Total Donations</p>
            <h3 className="text-2xl font-bold">₹{statistics.totalDonations.toLocaleString()}</h3>
          </div>
          <FaChartLine className="text-purple-500 text-3xl" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-gray-500">Completion Rate</p>
            <h3 className="text-2xl font-bold">{statistics.completionRate}%</h3>
          </div>
          <FaCheckCircle className="text-yellow-500 text-3xl" />
        </div>
      </div>

      {/* Assigned Issues */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FaTasks className="text-blue-500 mr-2" /> Completed Issues
          </h2>
        </div>
        <div className="flex justify-center items-center space-x-4 py-8">
          <div className="bg-gray-100 rounded-lg px-6 py-3 flex items-center space-x-2">
            <FaTasks className="text-blue-500" />
            <span className="text-lg font-semibold text-gray-700">
              {assignedIssues.length} Issues Completed
            </span>
          </div>
           <button
              onClick={() => navigate(`/ngo/${ngoId}/claimed-issues`)}
              className="group flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition transform hover:scale-105"
            >
              <span className="text-lg font-semibold">View All Completed Issues</span>
              <FaArrowRight className="group-hover:translate-x-1 transition" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default NGODetails; 
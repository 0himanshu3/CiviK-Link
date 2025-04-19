// src/pages/NGODashh.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
  FaTasks,
  FaUsers,
  FaHandHoldingHeart,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaFilter,
  FaImage,
  FaArrowRight,
  FaTrophy,
  FaSearch,
  FaSort,
  FaStar
} from 'react-icons/fa';

const NGODashh = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);

  // Dashboard state
  const [statistics, setStatistics] = useState({
    totalIssuesResolved: 0,
    activeVolunteers: 0,
    totalDonations: 5000, 
    completionRate: 0
  });
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [taskProofs, setTaskProofs] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [isLoading, setIsLoading] = useState(true);
  const [collaboratedIssuesCount, setCollaboratedIssuesCount] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch NGO's data
  useEffect(() => {
    const fetchNGOData = async () => {
      // Don't fetch if still loading auth or not authenticated
      if (authLoading || !isAuthenticated || !user?._id) {
        return;
      }

      try {
        setIsLoading(true);
        const ngoId = user._id;
        
        // Fetch issue requests made by this NGO
        const issueRequestsResponse = await fetch(`http://localhost:3000/api/v1/issue-request/${ngoId}`);
        const issueRequests = await issueRequestsResponse.json();

        // Extract issue IDs from requests
        const issueIds = issueRequests;
        // Fetch issues by IDs
        const claimedIssues = [];

        for (let i = 0; i < issueIds.length; i++) {
          const issueId = issueIds[i];
          
          try {
            const issueResponse = await fetch(`http://localhost:3000/api/v1/issues/getIssue/${issueId}`);
            const issueResult = await issueResponse.json();
            if (issueResult.success) {
              claimedIssues.push(issueResult.data); // Add the issue to the claimedIssues array
            } else {
              console.error(`Failed to fetch issue with ID: ${issueId}`);
            }
          } catch (error) {
            console.error(`Error fetching issue with ID: ${issueId}`, error);
          }
        }

        // Calculate statistics
        const completedIssues = claimedIssues.filter(issue => issue.status === 'Completed');
        const onTimeCompletedIssues = completedIssues.filter(issue => {
          if (!issue.deadline) return false;
          const completionDate = new Date(issue.updatedAt);
          const deadline = new Date(issue.deadline);
          return completionDate <= deadline;
        });
        // Get active volunteers (unique volunteers from all claimed issues)
        const flattenedIssues = claimedIssues.flat();

        // Initialize set
        const activeVolunteersSet = new Set();

        // Extract volunteer IDs
        flattenedIssues.forEach(issue => {
          issue.volunteerPositions?.forEach(position => {
            position.registeredVolunteers?.forEach(volunteerId => {
              activeVolunteersSet.add(volunteerId);
            });
          });
        });
        setStatistics({
          totalIssuesResolved: completedIssues.length,
          activeVolunteers: activeVolunteersSet.size,
          totalDonations: 5000, 
          completionRate: claimedIssues.length > 0 
            ? Math.round((onTimeCompletedIssues.length / claimedIssues.length) * 100) 
            : 0
        });
        console.log(claimedIssues);
        // Set assigned issues
        setAssignedIssues(
          flattenedIssues.map(issue => ({
            id: issue._id,
            title: issue.title,
            location: issue.issueLocation,
            status: (issue.status || 'unknown').toLowerCase(),
            startDate: new Date(issue.createdAt).toISOString().split('T')[0],
            deadline: issue.deadline
              ? new Date(issue.deadline).toISOString().split('T')[0]
              : null,
            progress:
              issue.status === 'Completed' ? 100 :
              issue.status === 'Assigned' ? 50 : 0,
            media: issue.images?.map(img => img.url) || [],
            description: issue.content
          }))
        );

        // Set active jobs (from volunteer positions)
        const jobs = flattenedIssues
          .filter(issue => issue.status !== 'Completed')
          .flatMap(issue => 
            issue.volunteerPositions?.map(position => ({
              id: `${issue._id}-${position.position}`,
              title: `${position.position} - ${issue.title}`,
              slots: { 
                total: position.slots, 
                filled: position.registeredVolunteers?.length || 0 
              },
              whatsappLink: `https://wa.me/group/${issue._id}`,
              tasks: position.registeredVolunteers?.map(volunteerId => ({
                id: volunteerId,
                title: position.position,
                assignedTo: volunteerId,
                status: 'in-progress'
              })) || []
            }))
          );
        setActiveJobs(jobs);

        // Set task proofs (from issue comments)
        const proofs = flattenedIssues
          .filter(issue => issue.status === 'Completed')
          .flatMap(issue => 
            issue.comments?.map(comment => ({
              id: comment._id,
              taskId: issue._id,
              proofType: 'text',
              status: 'pending',
              submittedAt: comment.date,
              comment: comment.text
            }))
          );
        setTaskProofs(proofs);

        // Set achievements (based on completed issues)
        const achievements = completedIssues.map(issue => ({
          id: issue._id,
          title: `Completed: ${issue.title}`,
          date: new Date(issue.updatedAt).toISOString().split('T')[0],
          description: `Successfully resolved ${issue.title} in ${issue.issueLocation}`,
          media: issue.images?.map(img => img.url) || []
        }));
        setAchievements(achievements);

        // Set volunteers (from all claimed issues)
        const volunteerDetails = await Promise.all(
          Array.from(activeVolunteersSet).map(async (volunteerId) => {
            try {
              const response = await axios.get(`http://localhost:3000/api/v1/auth/${volunteerId}`);
              const volunteer = response.data.data;
             
              // Calculate the number of tasks completed by the volunteer
              const tasksCompleted = completedIssues.filter(issue => 
                issue.volunteerPositions?.some(position => 
                  position.registeredVolunteers?.includes(volunteer._id)
                )
              ).length;
              
              return {
                id: volunteer._id,
                name: volunteer.name,
                location: volunteer.location || 'Not Specified',
                totalDonations: volunteer.totalDonations || 0,
                tasksCompleted, // Number of tasks completed by the volunteer
              };
            } catch (error) {
              console.error(`Error fetching volunteer ${volunteerId}:`, error);
              return null;
            }
          })
        );

        // Set the volunteers state with the filtered details
        setVolunteers(volunteerDetails.filter(v => v !== null));
        

      } catch (error) {
        console.error('Error fetching NGO data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNGOData();
  }, [user, authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchCollaboratedIssuesCount = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/issues/collaborated/${user._id}`);
        if (!res.ok) throw new Error('Failed to fetch collaborated issues count');
        const data = await res.json();
        setCollaboratedIssuesCount(data.collaboratedIssues?.length || 0);
      } catch (err) {
        console.error('Error fetching collaborated issues count:', err);
      }
    };

    if (user?._id) fetchCollaboratedIssuesCount();
  }, [user]);

  const handleProofReview = (proofId, status) => {
    console.log(`Reviewing proof ${proofId}: ${status}`);
    // implement approval/rejection logic here
  };

  const handleLocationFilter = (loc) => {
    setSelectedLocation(loc);
    // implement filter logic here
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredVolunteers = volunteers.filter(vol =>
    vol.name.toLowerCase().includes(volunteerSearch.toLowerCase())
  );
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-semibold mb-6">Welcome, NGO!</h1>

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
            <h3 className="text-2xl font-bold">₹{statistics.totalDonations}</h3>
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
            <FaTasks className="text-blue-500 mr-2" /> Claimed Issues
          </h2>
        </div>
        <div className="flex justify-center items-center space-x-4 py-8">
          <div className="bg-gray-100 rounded-lg px-6 py-3 flex items-center space-x-2">
            <FaTasks className="text-blue-500" />
            <span className="text-lg font-semibold text-gray-700">
              {assignedIssues.length} Issues Claimed
            </span>
          </div>
      <button
            onClick={() => navigate('/ngo-dashboard/claimed-issues')}
            className="group flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition transform hover:scale-105"
      >
            <span className="text-lg font-semibold">View All Claimed Issues</span>
            <FaArrowRight className="group-hover:translate-x-1 transition" />
      </button>
        </div>
      </div>

      {/* Add this section after the claimed issues section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700">Collaborated Issues</h2>
          <button
            onClick={() => navigate('/collaborated-issues')}
            className="text-blue-500 hover:text-blue-600 flex items-center space-x-2"
          >
            <span>View All</span>
            <FaArrowRight />
          </button>
        </div>
        <p className="text-3xl font-bold text-blue-800">{collaboratedIssuesCount}</p>
        <p className="text-gray-600">Total collaborated issues</p>
      </div>

      {/* Active Jobs */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold flex items-center mb-4">
          <FaClock className="text-blue-500 mr-2" /> Active Jobs
        </h2>
        <div className="space-y-4">
          {activeJobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <p className="text-sm text-gray-600">
                Slots: {job.slots.filled}/{job.slots.total}
              </p>
              <a
                href={job.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline text-sm"
              >
                Join on WhatsApp
              </a>
              <div className="mt-2 space-y-2">
                {job.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2 border rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">
                        Assigned to: {task.assignedTo}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Proofs */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold flex items-center mb-4">
          <FaImage className="text-purple-500 mr-2" /> Task Proofs
        </h2>
        <div className="space-y-4">
          {taskProofs.map((proof) => (
            <div key={proof.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Task #{proof.taskId}</h3>
                  <p className="text-sm text-gray-600 mt-1">{proof.comment}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted: {new Date(proof.submittedAt).toLocaleString()}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-2 ${
                      proof.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {proof.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                <button
                    onClick={() => handleProofReview(proof.id, 'approved')}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                    Approve
                </button>
        <button
                    onClick={() => handleProofReview(proof.id, 'rejected')}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
        >
                    Reject
        </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold flex items-center mb-4">
          <FaTrophy className="text-yellow-500 mr-2" /> Achievements
        </h2>
        <div className="space-y-4">
          {achievements.map((ach) => (
            <div key={ach.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{ach.title}</h3>
              <p className="text-sm text-gray-600">Date: {ach.date}</p>
              <p className="mt-1">{ach.description}</p>
              {ach.media.length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {ach.media.map((m, i) => (
                    <img
                      key={i}
                      src={m}
                      alt={`Media ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Volunteer Management */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold flex items-center">
      <FaUsers className="text-purple-500 mr-2" /> Volunteer Management
    </h2>
    <div className="relative">
      <input
        type="text"
        placeholder="Search volunteers..."
        value={volunteerSearch}
        onChange={(e) => setVolunteerSearch(e.target.value)}
        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <FaSearch className="absolute left-3 top-3 text-gray-400" />
    </div>
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Location
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Total Donations
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Tasks Completed
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {filteredVolunteers.length > 0 ? (
          filteredVolunteers.map((vol) => (
            <tr key={vol.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">{vol.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{vol.location}</td>
              <td className="px-6 py-4 whitespace-nowrap">₹{vol.totalDonations}</td>
              <td className="px-6 py-4 whitespace-nowrap">{vol.tasksCompleted}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
              No volunteers found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
        </div>
    </div>
    </>
  );
};

export default NGODashh;

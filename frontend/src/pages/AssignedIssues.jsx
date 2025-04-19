import React, { useState, useEffect } from 'react';
import { FaTasks, FaMapMarkerAlt, FaCalendarAlt, FaArrowLeft, FaFilter, FaSearch, FaClock, FaUsers, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import CollaborationDropdown from '../components/CollaborationDropdown';

const AssignedIssues = () => {
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - Replace with actual API calls
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setAssignedIssues([
        {
          id: 1,
          title: "Community Garden Restoration",
          location: "Central Park",
          status: "in-progress",
          startDate: "2024-04-01",
          deadline: "2024-04-30",
          progress: 60,
          media: ["before1.jpg", "after1.jpg"],
          description: "Restoring the community garden to its former glory",
          volunteers: 8,
          tasksCompleted: 12,
          totalTasks: 20,
          priority: "high"
        },
        {
          id: 2,
          title: "Food Distribution Drive",
          location: "Downtown Area",
          status: "pending",
          startDate: "2024-05-01",
          deadline: "2024-05-15",
          progress: 0,
          media: [],
          description: "Weekly food distribution to needy families",
          volunteers: 0,
          tasksCompleted: 0,
          totalTasks: 15,
          priority: "medium"
        },
        {
          id: 3,
          title: "Elder Care Program",
          location: "Sunset District",
          status: "in-progress",
          startDate: "2024-04-10",
          deadline: "2024-05-10",
          progress: 30,
          media: ["elder1.jpg"],
          description: "Providing companionship and assistance to elderly residents",
          volunteers: 5,
          tasksCompleted: 6,
          totalTasks: 20,
          priority: "low"
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleLocationFilter = (location) => {
    setSelectedLocation(location);
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIssues = assignedIssues
    .filter(issue => {
      const matchesLocation = selectedLocation === 'all' || issue.location === selectedLocation;
      const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
      const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          issue.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLocation && matchesStatus && matchesSearch;
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/ngo-dashboard" className="flex items-center text-blue-500 hover:text-blue-700">
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Assigned Issues</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-3">Location Filter</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleLocationFilter('all')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedLocation === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                All Locations
              </button>
              <button
                onClick={() => handleLocationFilter('Central Park')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedLocation === 'Central Park' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Central Park
              </button>
              <button
                onClick={() => handleLocationFilter('Downtown Area')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedLocation === 'Downtown Area' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Downtown Area
              </button>
              <button
                onClick={() => handleLocationFilter('Sunset District')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedLocation === 'Sunset District' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Sunset District
              </button>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-3">Status Filter</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusFilter('all')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => handleStatusFilter('pending')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  filterStatus === 'pending' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleStatusFilter('in-progress')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  filterStatus === 'in-progress' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusFilter('completed')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  filterStatus === 'completed' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIssues.map((issue) => (
          <div key={issue.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {issue.media.length > 0 && (
              <div className="h-48 overflow-hidden">
                <img
                  src={issue.media[0]}
                  alt={issue.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{issue.title}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-gray-600">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{issue.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaCalendarAlt className="mr-2" />
                  <span>Deadline: {new Date(issue.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaUsers className="mr-2" />
                  <span>{issue.volunteers} Volunteers</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm text-gray-600">{issue.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${issue.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(issue.priority)}`}>
                  {issue.priority} priority
                </span>
                {issue.status === 'in-progress' && (
                  <CollaborationDropdown
                    issueId={issue.id}
                    assignedNgoId={issue.assignedTo}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredIssues.length === 0 && (
        <div className="text-center py-12">
          <FaTasks className="mx-auto text-gray-400 text-5xl mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">No issues found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
};

export default AssignedIssues; 
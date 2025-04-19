import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import IssueDetailsPage from './IssueDetail';
import axios from 'axios';
import NGOIssueDetailsPage from './NGOIssueDetails';
import { useSelector } from 'react-redux';
import UserIssueDetailsPage from './UserIssueDetails';

export default function IssueDetailsWrapper() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/v1/issues/${id}`);
        setIssue(res.data.issue);
      } catch (err) {
        setError('Failed to fetch issue');
      } finally {
        setLoading(false);
      }
    };
  
    fetchIssue();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>;
  
  if (error) return <div className="text-red-500 p-4 text-center">{error}</div>;
  
  if (!issue) return <div className="text-gray-500 p-4 text-center">Issue not found</div>;
  
  if (!user) return <div className="text-gray-500 p-4 text-center">Please log in to view issue details</div>;

  // Check if the current user is the assigned NGO
  if (issue.assignedTo === user.name) {
    return <NGOIssueDetailsPage issue={issue} />;
  }
  
  // Check if the current user is a collaborator
  if (issue.collaborators && issue.collaborators.some(collab => collab.id === user._id)) {
    return <NGOIssueDetailsPage issue={issue} />;
  }
  
  // Check if the current user is a regular user
  if (user.role === 'User') {
    return <UserIssueDetailsPage issue={issue} />;
  }
  
  // Default case: show regular issue details
  return <IssueDetailsPage issue={issue} />;
}

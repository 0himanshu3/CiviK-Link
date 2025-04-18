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
   const {user}= useSelector((state) => state.auth);
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/v1/issues/${id}`);
        setIssue(res.data.issue);  // Use res.data to access the response data
      } catch (err) {
        setError('Failed to fetch issue');
      } finally {
        setLoading(false);
      }
    };
  
    fetchIssue();
  }, [id]);

  console.log(issue);
  console.log(user);
  

  if (loading) return <p>Loading...</p>;
  if (!issue) return <p>Issue not found</p>;
  if(issue.assignedTo=== user.name){
  return <NGOIssueDetailsPage issue={issue} />;
  }else if(user.role==='User'){
    return <UserIssueDetailsPage issue={issue} />;
  }else{
    return <IssueDetailsPage issue={issue}/>;
  }
}

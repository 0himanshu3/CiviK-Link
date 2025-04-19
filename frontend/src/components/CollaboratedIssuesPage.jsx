import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

export default function CollaboratedIssuesPage() {
  const { user } = useSelector((state) => state.auth);
  const [collaboratedIssues, setCollaboratedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCollaboratedIssues = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/issues/collaborated/${user._id}`);
        if (!res.ok) throw new Error('Failed to fetch collaborated issues');
        const data = await res.json();
        
        setCollaboratedIssues(data.collaboratedIssues || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) fetchCollaboratedIssues();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Collaborated Issues</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && collaboratedIssues.length === 0 && (
        <p className="text-gray-600">No collaborated issues yet.</p>
      )}

      <div className="space-y-6">
        {collaboratedIssues.map((issue) => (
          <div key={issue._id} className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-bold text-blue-800 mb-4">{issue.title}</h3>

            {issue.tags && issue.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {issue.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600">Location: {issue.issueLocation}</p>
                <p className="text-gray-600">Status: {issue.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Assigned NGO: {issue.assignedTo}</p>
                <p className="text-gray-600">Created: {new Date(issue.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => navigate(`/issue/${issue._id}`)}
                className="group flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition transform hover:scale-105"
              >
                <span>View Details</span>
                <FaArrowRight className="group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
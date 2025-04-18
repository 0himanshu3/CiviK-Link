import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function ClaimedIssuesPage() {
  const { user } = useSelector((state) => state.auth);
  const [claimedIssues, setClaimedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClaimedIssues = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/issues/claimed/${user._id}`);
        if (!res.ok) throw new Error('Failed to fetch claimed issues');
        const data = await res.json();
        setClaimedIssues(data.claimedIssues || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) fetchClaimedIssues();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Claimed Issues</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && claimedIssues.length === 0 && (
        <p className="text-gray-600">No claimed issues yet.</p>
      )}

      <div className="space-y-6">
        {claimedIssues.map((issue) => (
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

            <div
              className="text-gray-700 mb-2"
              dangerouslySetInnerHTML={{
                __html: issue.content
                  ? issue.content.length > 100
                    ? issue.content.slice(0, 100) + '...'
                    : issue.content
                  : 'No description available',
              }}
            />

            <p className="text-sm text-gray-500 mb-2">
              <strong>Location:</strong> {issue.issueLocation}
            </p>

            <p className="text-sm text-gray-500 mb-4">
              <strong>Status:</strong> {issue.status}
            </p>

            <p className="text-sm text-gray-500 mb-4">
              <strong>Deadline:</strong>{' '}
              {issue.deadline ? new Date(issue.deadline).toLocaleDateString() : 'Not set'}
            </p>

            <button
              onClick={() => navigate(`/issues/${issue._id}`)}
              className="inline-block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Full Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

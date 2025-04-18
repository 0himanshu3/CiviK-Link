import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function CreatedIssues() {
  const { user } = useSelector((state) => state.auth);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!user?._id) return;

    const fetchUserIssues = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/issues/users/${user._id}`);
        if (!res.ok) throw new Error('Failed to fetch user issues');
        const data = await res.json();
        
        // Sort issues by creation date in descending order (newest first)
        const sortedIssues = data.data.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setIssues(sortedIssues || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserIssues();
  }, [user]);

  const filteredIssues = issues.filter(issue => {
    if (activeFilter === 'all') return true;
    return issue.status.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="flex h-screen bg-gray-100 p-6 overflow-y-auto w-full">
      <div className="max-w-5xl w-full mx-auto">
        <h1 className="text-3xl font-semibold mb-6 text-blue-700">Your Created Issues</h1>

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Issues
          </button>
          <button
            onClick={() => setActiveFilter('open')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'open'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Open Issues
          </button>
          <button
            onClick={() => setActiveFilter('assigned')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'assigned'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Assigned Issues
          </button>
        </div>

        {loading && <p className="text-gray-600">Loading issues...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && filteredIssues.length === 0 && (
          <p className="text-gray-600">No issues found.</p>
        )}

        {!loading &&
          !error &&
          filteredIssues.map((issue) => (
            <div
              key={issue._id}
              className="bg-white p-4 rounded-lg shadow-md mb-4"
            >
              <h2 className="text-xl font-bold text-blue-800">{issue.title}</h2>

              <p
                className="text-gray-700 mt-2"
                dangerouslySetInnerHTML={{
                  __html:
                    issue.content.length > 150
                      ? issue.content.substring(0, 150) + '...'
                      : issue.content,
                }}
              />

              <div className="mt-2 text-sm text-gray-600">
                <strong>Status:</strong>{' '}
                <span
                  className={`px-2 py-1 rounded-full ${
                    issue.status === 'Open'
                      ? 'bg-yellow-100 text-yellow-700'
                      : issue.status === 'Assigned'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {issue.status}
                </span>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                <strong>Location:</strong> {issue.issueLocation}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {issue.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                to={`/issues/${issue._id}`}
                className="inline-block mt-4 text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
              >
                View Details
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}

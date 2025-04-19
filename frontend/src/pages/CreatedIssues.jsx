import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaTag, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';

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

  // Status badge styling
  const statusBadge = (status) => {
    if (status === 'Open')
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    if (status === 'Assigned')
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    return 'bg-green-100 text-green-700 border border-green-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-10 px-2 md:px-6">
      <div className="max-w-5xl w-full mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-blue-800 tracking-tight flex items-center gap-3">
          <FaInfoCircle className="text-blue-400" /> Your Created Issues
        </h1>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {[
            { label: 'All Issues', value: 'all' },
            { label: 'Open Issues', value: 'open' },
            { label: 'Assigned Issues', value: 'assigned' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-5 py-2 rounded-full font-semibold shadow-sm transition-colors duration-200 border
                ${activeFilter === filter.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-blue-500 text-lg animate-pulse">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading issues...
          </div>
        )}
        {error && <p className="text-red-600 font-semibold">{error}</p>}

        {!loading && !error && filteredIssues.length === 0 && (
          <div className="text-gray-500 text-lg flex items-center gap-2 mt-12">
            <FaInfoCircle className="text-blue-300" /> No issues found.
          </div>
        )}

        <div className="grid gap-6 mt-2">
          {!loading &&
            !error &&
            filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-200 p-6 border-l-4 border-blue-200 group"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h2 className="text-2xl font-bold text-blue-800 group-hover:underline transition">{issue.title}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusBadge(issue.status)}`}
                  >
                    {issue.status}
                  </span>
                </div>

                <div
                  className="text-gray-700 mt-3 text-base"
                  dangerouslySetInnerHTML={{
                    __html:
                      issue.content.length > 150
                        ? issue.content.substring(0, 150) + '...'
                        : issue.content,
                  }}
                />

                <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-500 text-sm">
                  <div className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-blue-400" />
                    <span>
                      <strong className="text-gray-700">Location:</strong> {issue.issueLocation}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaTag className="text-blue-400" />
                    <span className="flex flex-wrap gap-1">
                      {issue.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/issues/${issue._id}`}
                  className="inline-block mt-5 text-white bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-2 rounded-full shadow hover:from-blue-600 hover:to-blue-800 transition font-semibold"
                >
                  View Details
                </Link>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

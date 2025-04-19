import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const [allTags, setAllTags] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/issues/getAll', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch issues');
        const data = await res.json();
        const issueList = data.data || [];

        setIssues(issueList);
        setFilteredIssues(issueList);

        // Extract unique tags and locations
        const tagsSet = new Set();
        const locationSet = new Set();
        issueList.forEach(issue => {
          issue.tags?.forEach(tag => tagsSet.add(tag));
          if (issue.issueLocation) locationSet.add(issue.issueLocation);
        });

        setAllTags([...tagsSet]);
        setAllLocations([...locationSet]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  useEffect(() => {
    let temp = [...issues];

    if (searchTerm) {
      temp = temp.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLocation) {
      temp = temp.filter(issue => issue.issueLocation === selectedLocation);
    }

    if (selectedTags.length > 0) {
      temp = temp.filter(issue =>
        selectedTags.every(tag => issue.tags?.includes(tag))
      );
    }

    setFilteredIssues(temp);
  }, [searchTerm, selectedLocation, selectedTags, issues]);

  const handleTagChange = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleUpvote = async (issueId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/v1/issues/upvote/${issueId}`,
        {},
        { withCredentials: true }
      );
      setIssues(prev =>
        prev.map(issue =>
          issue._id === issueId
            ? {
                ...issue,
                upvoters: issue.upvoters.includes(user._id)
                  ? issue.upvoters
                  : [...issue.upvoters, user._id],
                downvoters: issue.downvoters.filter(id => id !== user._id),
              }
            : issue
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownvote = async (issueId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/v1/issues/downvote/${issueId}`,
        {},
        { withCredentials: true }
      );
      setIssues(prev =>
        prev.map(issue =>
          issue._id === issueId
            ? {
                ...issue,
                downvoters: issue.downvoters.includes(user._id)
                  ? issue.downvoters
                  : [...issue.downvoters, user._id],
                upvoters: issue.upvoters.filter(id => id !== user._id),
              }
            : issue
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">All Issues</h2>

      {/* Filters */}
      <div className="mb-6 bg-gray-100 p-4 rounded-md shadow-sm">
        <input
          type="text"
          placeholder="Search by name"
          className="p-2 border rounded w-full mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex flex-wrap gap-4">
          {/* Location Dropdown */}
          <select
            className="p-2 border rounded"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {allLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Tag Checkboxes */}
          <div className="flex flex-wrap gap-2 items-center">
            {allTags.map((tag) => (
              <label key={tag} className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagChange(tag)}
                />
                <span className="text-sm">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {loading && <p>Loading issues...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && filteredIssues.length === 0 && (
        <p className="text-gray-600">No matching issues found.</p>
      )}

      {!loading && !error && filteredIssues.length > 0 && (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div
              key={issue._id}
              className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col"
            >
              <h3 className="text-xl font-bold mb-2 text-blue-800">{issue.title}</h3>

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
                className="text-gray-700 flex-1 mb-2"
                dangerouslySetInnerHTML={{
                  __html: issue.content
                    ? issue.content.length > 100
                      ? issue.content.substring(0, 100) + '...'
                      : issue.content
                    : 'No description',
                }}
              />

              <p className="text-sm text-gray-500 mb-2">
                <strong>Location:</strong> {issue.issueLocation}
              </p>

              {user?.role === 'User' && (
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => handleUpvote(issue._id)}
                    className={`px-3 py-1 rounded text-white font-semibold ${issue.upvoters.includes(user._id)
                      ? 'bg-green-600'
                      : 'bg-gray-500'
                      }`}
                  >
                    👍 {issue.upvoters.length}
                  </button>
                  <button
                    onClick={() => handleDownvote(issue._id)}
                    className={`px-3 py-1 rounded text-white font-semibold ${issue.downvoters.includes(user._id)
                      ? 'bg-red-600'
                      : 'bg-gray-500'
                      }`}
                  >
                    👎 {issue.downvoters.length}
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate(`/issues/${issue._id}`)}
                className="mt-4 inline-block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

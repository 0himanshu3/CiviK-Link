import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FaSearch, FaMapMarkerAlt, FaTag, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-10 px-2 md:px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-blue-800 tracking-tight">All Issues</h2>

        {/* Filters */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative w-full md:w-1/2">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by issue title"
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="p-2 border border-gray-200 rounded-lg w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {allLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-gray-600 flex items-center gap-1">
              <FaTag className="text-blue-400" /> Tags:
            </span>
            {allTags.map((tag) => (
              <label key={tag} className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagChange(tag)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-blue-700">{tag}</span>
              </label>
            ))}
          </div>
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
            No matching issues found.
          </div>
        )}

        {!loading && !error && filteredIssues.length > 0 && (
          <div className="grid gap-8 mt-2">
            {filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-200 p-6 border-l-4 border-blue-200 group flex flex-col"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3 className="text-2xl font-bold text-blue-800 group-hover:underline transition">{issue.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {issue.tags && issue.tags.length > 0 && issue.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className="text-gray-700 mt-2 text-base"
                  dangerouslySetInnerHTML={{
                    __html: issue.content
                      ? issue.content.length > 100
                        ? issue.content.substring(0, 100) + '...'
                        : issue.content
                      : 'No description',
                  }}
                />

                <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                  <FaMapMarkerAlt className="text-blue-400" />
                  <span>
                    <strong className="text-gray-700">Location:</strong> {issue.issueLocation}
                  </span>
                </div>

                {user?.role === 'User' && (
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() => handleUpvote(issue._id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-white font-semibold transition
                        ${issue.upvoters.includes(user._id)
                          ? 'bg-green-600'
                          : 'bg-gray-400 hover:bg-green-500'
                        }`}
                    >
                      <FaThumbsUp /> {issue.upvoters.length}
                    </button>
                    <button
                      onClick={() => handleDownvote(issue._id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-white font-semibold transition
                        ${issue.downvoters.includes(user._id)
                          ? 'bg-red-600'
                          : 'bg-gray-400 hover:bg-red-500'
                        }`}
                    >
                      <FaThumbsDown /> {issue.downvoters.length}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/issues/${issue._id}`)}
                  className="mt-6 w-max text-white bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-2 rounded-full shadow hover:from-blue-600 hover:to-blue-800 transition font-semibold"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

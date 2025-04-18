import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function IssueDetailsPage({ issue: initialIssue }) {
  const [issue, setIssue] = useState(initialIssue);
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [timeline, setTimeline] = useState('');
  const [errors, setErrors] = useState({});
  const { user } = useSelector((state) => state.auth);
  const [currentIndex, setCurrentIndex] = useState(0);
  console.log(issue);
  

  const handleSubmit = async () => {
    let currentErrors = {};

    if (!description.trim()) {
      currentErrors.description = 'Description is required';
    }

    if (!timeline) {
      currentErrors.timeline = 'Please select a valid timeline date';
    } else if (dayjs(timeline).isBefore(dayjs(), 'day')) {
      currentErrors.timeline = 'Timeline must be a future date';
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setErrors({});

    try {
      const res = await axios.post('http://localhost:3000/api/v1/issue-request/requesting', {
        issueId: issue._id,
        description,
        timeline: dayjs(timeline).toISOString(),
        ngoUsername: user.name,
        ngoUserid: user._id,
      });

      toast.success('Request submitted successfully!');
      setShowModal(false);
      setDescription('');
      setTimeline('');

      // ✅ Update assignedTo locally after successful request
      setIssue((prev) => ({
        ...prev,
        assignedTo: user.name, // or user._id based on backend logic
      }));
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong while submitting the request.');
    }
  };

  const handleNext = () => {
    if (currentIndex < issue.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">{issue.title}</h1>
        <p className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: issue.content }}></p>

        <div className="mb-4">
          <span className="font-semibold text-gray-800">Location:</span> {issue.issueLocation}
        </div>

        <div className="mb-4">
          <span className="font-semibold text-gray-800">Status:</span>{' '}
          <span
            className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${issue.status === 'Open'
                ? 'bg-yellow-100 text-yellow-700'
                : issue.status === 'Assigned'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
          >
            {issue.status}
          </span>
        </div>

        <div className="mb-4">
          <span className="font-semibold text-gray-800">Tags:</span>
          <div className="flex space-x-2 mt-2">
            {issue.tags.map((tag, i) => (
              <span
                key={i}
                className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {issue.images && issue.images.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Images</h2>
            <div className="relative">
              <img
                src={issue.images[currentIndex].url}
                alt={issue.images[currentIndex].caption}
                className="rounded-lg shadow w-full"
                style={{
                  height: '300px',
                  objectFit: 'contain',
                  width: '100%',
                }}
              />
              <div
                className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-500 bg-opacity-50 p-2 cursor-pointer"
                onClick={handlePrevious}
              >
                <span className="text-white text-lg">←</span>
              </div>
              <div
                className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-500 bg-opacity-50 p-2 cursor-pointer"
                onClick={handleNext}
              >
                <span className="text-white text-lg">→</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {issue.images[currentIndex].caption}
              </p>
            </div>
          </div>
        )}


        {/* Assigned To Section */}
        <div className="mb-6">
          <span className="font-semibold text-gray-800">Assigned To:</span>{' '}
          {issue.assignedTo !== null ? (
            <div>
              <p>{issue.assignedTo}</p>
              {issue.deadline && (
                <p className="text-sm text-gray-600 mt-1">
                  Deadline: {dayjs(issue.deadline).format('MMMM D, YYYY')}
                </p>
              )}
            </div>
          ) : (
            <span className="italic">None</span>
          )}
        </div>


        {/* Request Button */}
        {issue.assignedTo === null && (
          <div className="mb-6">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
            >
              Request This Issue
            </button>
          </div>
        )}

        {/* Comments */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Comments</h2>
          <div className="bg-gray-100 rounded-lg p-4 space-y-3">
            {issue.comments.map((comment, i) => (
              <div key={i}>
                <p className="text-sm text-gray-800">{comment.text}</p>
                <p className="text-xs text-gray-500">
                  Posted on {new Date(comment.date).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg">
            <h3 className="text-xl font-bold mb-4">Request This Issue</h3>

            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2"
              rows={3}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mb-2">{errors.description}</p>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
            <input
              type="date"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2"
            />
            {errors.timeline && (
              <p className="text-red-600 text-sm mb-4">{errors.timeline}</p>
            )}

            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

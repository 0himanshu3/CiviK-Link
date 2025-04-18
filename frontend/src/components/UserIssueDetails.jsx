import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase'; // your Firebase initialization

export default function UserIssueDetailsPage({ issue: initialIssue }) {
  const [issue, setIssue] = useState(initialIssue);
  const { user } = useSelector((state) => state.auth);

  // ——— user’s own tasks for this issue ———
  const [userTasks, setUserTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // ——— volunteer registration ———
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');

  // ——— proof‐of‐completion modal ———
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);
  const [proofMessage, setProofMessage] = useState('');
  const [proofFiles, setProofFiles] = useState([]);

  // ——— update‐task modal ———
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');

  // ——— feedback modal ———
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [resolved, setResolved] = useState(null);
  const [satisfaction, setSatisfaction] = useState(5);
  const [suggestions, setSuggestions] = useState('');
  const [issueProblem, setIssueProblem] = useState('');

  // ——— image carousel ———
  const [currentIndex, setCurrentIndex] = useState(0);

  // fetch this user’s tasks when issue changes
  useEffect(() => {
    if (!issue._id) return;
    setTasksLoading(true);
    axios
      .get(`http://localhost:3000/api/v1/issues/${issue._id}/my-tasks`, { withCredentials: true })
      .then((res) => {
        setUserTasks(res.data.tasks || []);
        setTasksLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load your tasks');
        setTasksLoading(false);
      });
  }, [issue._id]);

  // volunteer registration
  const handleVolunteerRegister = async () => {
    try {
      await axios.post(
        `http://localhost:3000/api/v1/issues/${issue._id}/registerVolunteer`,
        { position: selectedPosition },
        { withCredentials: true }
      );
      toast.success('Registered successfully!');
      setShowVolunteerModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  // proof modal handlers
  const openProofModal = (task) => {
    setSelectedTaskForProof(task);
    setProofMessage('');
    setProofFiles([]);
    setShowProofModal(true);
  };
  const handleProofFileChange = (e) => {
    setProofFiles(Array.from(e.target.files));
  };
  const handleProofSubmit = async () => {
    if (!selectedTaskForProof) return;
    try {
      const storage = getStorage(app);

      // 1. upload to Firebase and collect URLs
      const uploadPromises = proofFiles.map((file) => {
        const path = `proofs/${selectedTaskForProof._id}/${Date.now()}_${file.name}`;
        const fileRef = storageRef(storage, path);
        const uploadTask = uploadBytesResumable(fileRef, file);
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (err) => reject(err),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      });
      const urls = await Promise.all(uploadPromises);

      // 2. send to backend
      await axios.post(
        `http://localhost:3000/api/v1/issues/tasks/${selectedTaskForProof._id}/proof`,
        { message: proofMessage, images: urls },
        { withCredentials: true }
      );

      toast.success('Proof submitted successfully!');
      setShowProofModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit proof');
    }
  };

  // update modal handlers
  const openUpdateModal = (task) => {
    setSelectedTaskForUpdate(task);
    setUpdateTitle('');
    setUpdateContent('');
    setShowUpdateModal(true);
  };
  const handleUpdateSubmit = async () => {
    if (!selectedTaskForUpdate) return;
    try {
      await axios.post(
        `http://localhost:3000/api/v1/tasks/${selectedTaskForUpdate._id}/updates`,
        { title: updateTitle, content: updateContent },
        { withCredentials: true }
      );
      toast.success('Update sent!');
      setShowUpdateModal(false);
    } catch {
      toast.error('Update failed');
    }
  };

  // feedback submit
  const handleFeedbackSubmit = async () => {
    try {
      const payload = {
        resolved,
        satisfaction: resolved === 'Yes' ? satisfaction : null,
        suggestions: resolved === 'Yes' ? suggestions : null,
        issueProblem: resolved === 'No' ? issueProblem : null,
      };
      await axios.post(
        `http://localhost:3000/api/v1/issues/${issue._id}/feedback`,
        payload,
        { withCredentials: true }
      );
      toast.success('Feedback submitted!');
      setShowFeedbackModal(false);
    } catch {
      toast.error('Feedback failed');
    }
  };

  // carousel handlers
  const handleNext = () =>
    currentIndex < issue.images.length - 1 && setCurrentIndex(currentIndex + 1);
  const handlePrevious = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        {/* Issue Header */}
        <h1 className="text-3xl font-bold text-blue-800 mb-4">{issue.title}</h1>
        <p
          className="text-gray-700 mb-4 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: issue.content }}
        />

        {/* Location / Status / Tags */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center">
            <span className="font-semibold">Location:</span>
            <span className="ml-2">{issue.issueLocation}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">Status:</span>
            <span
              className={`ml-2 px-3 py-1 rounded-full text-sm ${
                issue.status === 'Open'
                  ? 'bg-yellow-100 text-yellow-800'
                  : issue.status === 'Assigned'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {issue.status}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">Tags:</span>
            <div className="flex flex-wrap gap-2 ml-2">
              {issue.tags.map((t) => (
                <span key={t} className="bg-blue-200 text-blue-800 px-2 rounded-full text-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Image Carousel */}
        {issue.images?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Images</h2>
            <div className="relative">
              <img
                src={issue.images[currentIndex].url}
                alt={issue.images[currentIndex].caption}
                className="w-full h-64 object-contain rounded"
              />
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 bg-gray-500 bg-opacity-50 p-2 rounded-r text-white"
              >
                ‹
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 bg-gray-500 bg-opacity-50 p-2 rounded-l text-white"
              >
                ›
              </button>
            </div>
          </div>
        )}

        {/* Assigned To */}
        <div className="mb-6">
          <span className="font-semibold">Assigned To:</span>{' '}
          {issue.assignedTo ? (
            <span className="ml-2">{issue.assignedTo}</span>
          ) : (
            <span className="italic ml-2">None</span>
          )}
          {issue.deadline && (
            <div className="text-sm text-gray-600">
              Deadline: {dayjs(issue.deadline).format('MMMM D, YYYY')}
            </div>
          )}
        </div>

        {/* Volunteer Registration */}
        {user.role === 'User' && issue.volunteerPositions?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Volunteer Positions</h2>
            <ul className="space-y-2">
              {issue.volunteerPositions.map((pos) => (
                <li
                  key={pos._id}
                  className="flex justify-between items-center border p-3 rounded"
                >
                  <div>
                    <div className="font-medium">{pos.position}</div>
                    <div className="text-sm text-gray-600">
                      Slots left: {pos.slots - pos.registeredVolunteers.length}
                    </div>
                  </div>
                  {pos.registeredVolunteers.includes(user._id) && (
                    <span className="text-green-600">Registered</span>
                  )}
                </li>
              ))}
            </ul>
            {!issue.volunteerPositions.some((p) =>
              p.registeredVolunteers.includes(user._id)
            ) && (
              <button
                onClick={() => setShowVolunteerModal(true)}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
              >
                Register to Volunteer
              </button>
            )}
          </div>
        )}

        {/* Your Tasks */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
          {tasksLoading ? (
            <p>Loading tasks…</p>
          ) : userTasks.length === 0 ? (
            <p className="text-gray-500">No tasks assigned.</p>
          ) : (
            userTasks.map((task) => (
              <div
                key={task._id}
                className="border p-4 rounded mb-4 bg-white shadow"
              >
                <div className="font-medium mb-1">{task.description}</div>
                <div className="text-sm text-gray-600 mb-3">
                  Status: {task.status}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => !task.proofSubmitted && openProofModal(task)}
                    disabled={task.proofSubmitted}
                    className={`px-3 py-1 rounded text-white ${
                      task.proofSubmitted ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600'
                    }`}
                  >
                    {task.proofSubmitted ? 'Proof submitted already' : 'Submit Proof'}
                  </button>

                  <button
                    onClick={() => openUpdateModal(task)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Send Update
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Give Feedback */}
        {user.role === 'User' && issue.status === 'Completed' && (
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="bg-indigo-700 text-white px-5 py-2 rounded"
          >
            Give Feedback
          </button>
        )}
      </div>

      {/* Volunteer Modal */}
      {showVolunteerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Choose Position</h3>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            >
              <option value="">Select…</option>
              {issue.volunteerPositions.map((p) => (
                <option key={p._id} value={p.position}>
                  {p.position}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowVolunteerModal(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleVolunteerRegister}
                disabled={!selectedPosition}
                className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">
              Proof for: {selectedTaskForProof?.description}
            </h3>
            <textarea
              className="w-full border p-2 rounded mb-3"
              rows={3}
              placeholder="Your message"
              value={proofMessage}
              onChange={(e) => setProofMessage(e.target.value)}
            />
            <input
              type="file"
              multiple
              onChange={handleProofFileChange}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleProofSubmit}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">
              Update for: {selectedTaskForUpdate?.description}
            </h3>
            <input
              type="text"
              className="w-full border p-2 rounded mb-2"
              placeholder="Title"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
            />
            <textarea
              className="w-full border p-2 rounded mb-3"
              rows={3}
              placeholder="Content"
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Send Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Submit Feedback</h3>
            <p className="mb-2">Was it resolved?</p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setResolved('Yes')}
                className={`px-3 py-1 rounded ${
                  resolved === 'Yes' ? 'bg-green-600 text-white' : 'border'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setResolved('No')}
                className={`px-3 py-1 rounded ${
                  resolved === 'No' ? 'bg-red-600 text-white' : 'border'
                }`}
              >
                No
              </button>
            </div>
            {resolved === 'Yes' && (
              <>
                <label className="block mb-1">Satisfaction:</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={satisfaction}
                  onChange={(e) => setSatisfaction(e.target.value)}
                  className="w-full mb-2"
                />
                <textarea
                  className="w-full border p-2 rounded mb-4"
                  rows={2}
                  placeholder="Suggestions?"
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                />
              </>
            )}
            {resolved === 'No' && (
              <textarea
                className="w-full border p-2 rounded mb-4"
                rows={2}
                placeholder="What went wrong?"
                value={issueProblem}
                onChange={(e) => setIssueProblem(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={resolved === null}
                className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
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

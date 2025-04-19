import React, { useState, useEffect, useRef } from 'react'; // Added useRef from [1]
import { useSelector } from 'react-redux';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase'; // your Firebase initialization
// Added missing icons from [1]
import { HiLocationMarker, HiTag, HiCalendar, HiOutlinePhotograph, HiPaperClip, HiOutlineChatAlt, HiOutlineCheckCircle, HiOutlineXCircle, HiChevronLeft, HiChevronRight, HiUserGroup, HiInformationCircle } from "react-icons/hi";

// Using functional component structure from both [1] and [2]
export default function UserIssueDetailsPage({ issue: initialIssue }) {
  // State variables - combining necessary state from both [1] and [2]
  const [issue, setIssue] = useState(initialIssue);
  const { user } = useSelector((state) => state.auth);
  const [userTasks, setUserTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);
  const [proofMessage, setProofMessage] = useState('');
  const [proofFiles, setProofFiles] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [resolved, setResolved] = useState(null); // Keep 'Yes'/'No'/null logic from [1]
  const [satisfaction, setSatisfaction] = useState(5);
  const [suggestions, setSuggestions] = useState('');
  const [issueProblem, setIssueProblem] = useState(''); // Keep renamed variable from [1]
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ref for modals to handle outside click (from [1])
  const modalRef = useRef(null);

  // Close modal when clicking outside (from [1])
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowVolunteerModal(false);
        setShowProofModal(false);
        setShowUpdateModal(false);
        setShowFeedbackModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // Dependency array from [1]

  // fetch this user’s tasks when issue changes (logic primarily from [2], enhanced error handling from [1])
  useEffect(() => {
    if (!issue?._id) return; // Safe navigation from [1]
    setTasksLoading(true);
    axios
      .get(`http://localhost:3000/api/v1/issues/${issue._id}/my-tasks`, { withCredentials: true })
      .then((res) => {
        setUserTasks(res.data.tasks || []);
        setTasksLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load your tasks'); // Consistent error message from [1]
        setTasksLoading(false);
      });
  }, [issue?._id]); // Safe navigation dependency from [1]

  // volunteer registration (logic from [2], validation/toast from [1])
  const handleVolunteerRegister = async () => {
     if (!selectedPosition) { // Validation from [1]
       toast.warn('Please select a position.');
       return;
     }
    try {
      await axios.post(
        `http://localhost:3000/api/v1/issues/${issue._id}/registerVolunteer`,
        { position: selectedPosition },
        { withCredentials: true }
      );
      toast.success('Registered successfully!'); // Message from [1]
       // Optimistically update UI or refetch issue data if needed (comment from [1])
      setShowVolunteerModal(false);
      setSelectedPosition(''); // Reset selection from [1]
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed'); // Detailed error from [1]
    }
  };

  // proof modal handlers (logic from [2], validation/toast/optimistic update from [1])
  const openProofModal = (task) => {
    setSelectedTaskForProof(task);
    setProofMessage('');
    setProofFiles([]);
    setShowProofModal(true);
  };
  const handleProofFileChange = (e) => {
    // Consider adding file size/type validation here (comment from [1])
    setProofFiles(Array.from(e.target.files));
  };
  const handleProofSubmit = async () => {
    if (!selectedTaskForProof) return;
     if (!proofMessage.trim() && proofFiles.length === 0) { // Validation from [1]
         toast.warn('Please provide a message or upload at least one file.');
         return;
     }

    try {
      const storage = getStorage(app);
      let urls = []; // Define urls here as in [1]

      if (proofFiles.length > 0) { // Check from [1]
        // 1. upload to Firebase and collect URLs (logic consistent in [1] and [2])
        const uploadPromises = proofFiles.map((file) => {
          const path = `proofs/${selectedTaskForProof._id}/${Date.now()}_${file.name}`;
          const fileRef = storageRef(storage, path);
          const uploadTask = uploadBytesResumable(fileRef, file);
          return new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              null, // Optional: handle progress updates (comment from [1])
              (err) => reject(err),
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              }
            );
          });
        });
        urls = await Promise.all(uploadPromises);
      }

      // 2. send to backend (logic consistent)
      await axios.post(
        `http://localhost:3000/api/v1/issues/tasks/${selectedTaskForProof._id}/proof`,
        { message: proofMessage, images: urls }, // Payload structure from [1]
        { withCredentials: true }
      );

      toast.success('Proof submitted successfully!'); // Message from [1]
      setShowProofModal(false);
       // Refetch tasks or update task state locally to reflect submission (comment from [1])
       // Example: Update the specific task in userTasks state (logic from [1])
      setUserTasks(currentTasks =>
        currentTasks.map(task =>
          task._id === selectedTaskForProof._id ? { ...task, proofSubmitted: true } : task
        )
      );

    } catch (err) {
      console.error(err); // console.error from [1]
      toast.error('Failed to submit proof. Please check console for details.'); // Detailed error from [1]
    }
  };

  // update modal handlers (logic from [2], validation/toast from [1])
  const openUpdateModal = (task) => {
    setSelectedTaskForUpdate(task);
    setUpdateTitle(''); // Reset fields from [1]
    setUpdateContent(''); // Reset fields from [1]
    setShowUpdateModal(true);
  };
  const handleUpdateSubmit = async () => {
     if (!selectedTaskForUpdate || !updateTitle.trim() || !updateContent.trim()) { // Validation from [1]
       toast.warn('Please fill in both title and content for the update.');
       return;
     }
    // Use simpler check from [1] if needed: if (!selectedTaskForUpdate) return;
    try {
      await axios.post(
        `http://localhost:3000/api/v1/tasks/${selectedTaskForUpdate._id}/updates`,
        { title: updateTitle, content: updateContent },
        { withCredentials: true }
      );
      toast.success('Update sent successfully!'); // Message from [1]
      setShowUpdateModal(false);
    } catch (err) { // Catch specific err from [1]
      toast.error(err.response?.data?.message || 'Failed to send update.'); // Detailed error from [1]
    }
  };

  // feedback submit (logic from [2], adapted payload/validation/toast from [1])
  const handleFeedbackSubmit = async () => {
    if (resolved === null) { // Validation from [1]
        toast.warn('Please indicate if the issue was resolved.');
        return;
    }
    // Use payload structure from [1] for clarity and boolean conversion
    const payload = {
      resolved: resolved === 'Yes', // Send boolean from [1]
      satisfaction: resolved === 'Yes' ? parseInt(satisfaction, 10) : null, // Send number from [1]
      suggestions: resolved === 'Yes' ? suggestions : null,
      issueProblem: resolved === 'No' ? issueProblem : null, // Use renamed var from [1]
    };

    if (resolved === 'No' && !issueProblem.trim()) { // Validation from [1]
      toast.warn('Please explain what went wrong.');
      return;
    }
     // Optional prompt from [1]
     // if (resolved === 'Yes' && !suggestions.trim()) {
     //   toast.warn('Consider providing suggestions for improvement.');
     // }

    try {
      await axios.post(
        `http://localhost:3000/api/v1/issues/${issue._id}/feedback`,
        payload, // Use payload from [1]
        { withCredentials: true }
      );
      toast.success('Thank you for your feedback!'); // Message from [1]
      setShowFeedbackModal(false);
       // Optionally update issue state to reflect feedback submitted (comment from [1])
       // setIssue(prev => ({ ...prev, feedbackSubmitted: true }));
    } catch (err) { // Catch specific err from [1]
      toast.error(err.response?.data?.message || 'Feedback submission failed.'); // Detailed error from [1]
    }
  };

  // carousel handlers (using modulo logic from [1] for wrapping)
  const handleNext = () => {
      if (issue.images?.length > 1) { // Check from [1]
          setCurrentIndex((prevIndex) => (prevIndex + 1) % issue.images.length);
      }
  };
  const handlePrevious = () => {
      if (issue.images?.length > 1) { // Check from [1]
          setCurrentIndex((prevIndex) => (prevIndex - 1 + issue.images.length) % issue.images.length);
      }
  };

  // Determine if user has registered for any volunteer position (helper from [1])
  const isUserRegistered = issue.volunteerPositions?.some(p => p.registeredVolunteers?.includes(user?._id));


  // --- JSX Structure and Styling ---
  // Using the entire return block from the first file [1] for frontend presentation
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Issue Details Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            {/* Header: Title & Status */}
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{issue.title}</h1>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  issue.status === 'Open'
                    ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200'
                    : issue.status === 'Assigned'
                    ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-200'
                    : issue.status === 'Completed'
                    ? 'bg-green-100 text-green-800 ring-1 ring-green-200'
                    : 'bg-gray-100 text-gray-800 ring-1 ring-gray-200' // Default/fallback style
                }`}
              >
                {issue.status}
              </span>
            </div>

            {/* Metadata: Location, Tags, Assigned To, Deadline */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-4 text-gray-600 text-sm">
              <div className="flex items-center">
                <HiLocationMarker className="mr-2 h-5 w-5 text-blue-500" />
                {/* Use issueLocation field name from [2] */}
                <span>{issue.issueLocation || 'Not specified'}</span>
              </div>
              {issue.tags?.length > 0 && (
                <div className="flex items-center">
                   <HiTag className="mr-2 h-5 w-5 text-purple-500" />
                  <div className="flex flex-wrap gap-1">
                    {issue.tags.map((tag) => (
                      <span key={tag} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
               <div className="flex items-center">
                  <HiUserGroup className="mr-2 h-5 w-5 text-gray-500" />
                   {/* Use assignedTo field name from [2] */}
                  <span>Assigned To: {issue.assignedTo ? issue.assignedTo : <span className="italic">None</span>}</span>
              </div>
              {issue.deadline && (
                <div className="flex items-center">
                  <HiCalendar className="mr-2 h-5 w-5 text-red-500" />
                  <span>Deadline: {dayjs(issue.deadline).format('MMMM D, YYYY')}</span>
                </div>
              )}
            </div>

            {/* Issue Content */}
            <div className="prose prose-sm max-w-none mb-6" dangerouslySetInnerHTML={{ __html: issue.content }} />
          </div>

           {/* Image Carousel */}
          {issue.images?.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <HiOutlinePhotograph className="mr-2 h-5 w-5 text-gray-500"/> Images
                </h2>
                <div className="relative bg-gray-50 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                  <img
                    src={issue.images[currentIndex].url}
                    // Use caption field name from [2] if different, otherwise keep from [1]
                    alt={issue.images[currentIndex].caption || `Issue image ${currentIndex + 1}`}
                    className="max-h-full max-w-full object-contain rounded" // Changed for better containment in [1]
                  />
                  {issue.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-40 p-2 rounded-full text-white hover:bg-opacity-60 transition-opacity"
                        aria-label="Previous image" // Added in [1]
                      >
                        <HiChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-40 p-2 rounded-full text-white hover:bg-opacity-60 transition-opacity"
                        aria-label="Next image" // Added in [1]
                      >
                        <HiChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                 {/* Use caption field name from [2] if different, otherwise keep from [1] */}
                 {issue.images[currentIndex].caption && (
                    <p className="text-sm text-gray-600 mt-2 text-center italic">{issue.images[currentIndex].caption}</p>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Volunteer Section */}
        {/* Logic check `user.role === 'User'` from [2] combined with structure from [1] */}
        {user.role === 'User' && issue.volunteerPositions?.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <HiUserGroup className="h-6 w-6 text-blue-500 mr-2" />
                    Volunteer Opportunities
                </h2>
                <div className="space-y-3">
                {issue.volunteerPositions.map((pos) => (
                    <div key={pos._id} className="flex justify-between items-center border border-gray-200 p-3 rounded-lg bg-gray-50">
                        <div>
                            <div className="font-medium text-gray-700">{pos.position}</div>
                            <div className="text-sm text-gray-500">
                             {/* Calculation logic from [1] */}
                            Slots available: {Math.max(0, pos.slots - (pos.registeredVolunteers?.length || 0))} / {pos.slots}
                            </div>
                        </div>
                         {/* Check logic `pos.registeredVolunteers?.includes(user._id)` from [1] */}
                        {pos.registeredVolunteers?.includes(user._id) && (
                            <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center">
                                <HiOutlineCheckCircle className="h-4 w-4 mr-1"/> Registered
                            </span>
                        )}
                    </div>
                ))}
                </div>
                 {/* Use helper variable `isUserRegistered` from [1] */}
                {!isUserRegistered && (
                <button
                    onClick={() => setShowVolunteerModal(true)}
                    className="mt-5 inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                    Register to Volunteer
                </button>
                )}
             </div>
          </div>
        )}

        {/* Your Assigned Tasks Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <HiOutlineChatAlt className="h-6 w-6 text-indigo-500 mr-2" />
                    Your Tasks
                </h2>
                {tasksLoading ? (
                    <p className="text-gray-500 italic">Loading your tasks…</p> // Text from [1]
                ) : userTasks.length === 0 ? (
                    <p className="text-gray-500 italic">You have not been assigned any specific tasks for this issue yet.</p> // Text from [1]
                ) : (
                    <div className="space-y-4">
                        {userTasks.map((task) => (
                            <div key={task._id} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm"> {/* Styling from [1] */}
                                <div className="font-medium text-gray-800 mb-1">{task.description}</div>
                                <div className="text-sm text-gray-600 mb-3">
                                    {/* Status display styling from [1] */}
                                    Status: <span className={`font-medium ${task.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>{task.status}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => !task.proofSubmitted && openProofModal(task)}
                                    disabled={task.proofSubmitted}
                                     // Styling and conditional text from [1]
                                    className={`inline-flex items-center px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                                    task.proofSubmitted
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                                    }`}
                                >
                                    <HiPaperClip className="h-4 w-4 mr-1" />
                                    {task.proofSubmitted ? 'Proof Submitted' : 'Submit Proof'}
                                </button>

                                <button
                                    onClick={() => openUpdateModal(task)}
                                    // Styling from [1]
                                    className="inline-flex items-center px-3 py-1 text-sm rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                                >
                                    <HiOutlineChatAlt className="h-4 w-4 mr-1" />
                                    Send Update
                                </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>


        {/* Give Feedback Section */}
         {/* Conditional rendering logic from [1], assuming `issue.reporter` exists as in [1] */}
         {/* Check if `issue.reporter._id` exists in your data; adjust if needed */}
        {issue.reporter?._id === user._id && issue.status === 'Completed' && !issue.feedbackSubmitted && ( // Added check for feedbackSubmitted from [1]
             <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <HiInformationCircle className="h-6 w-6 text-teal-500 mr-2" />
                         Provide Feedback
                    </h2>
                    <p className="text-gray-600 mb-4 text-sm">Your feedback helps us improve. Please let us know about your experience.</p>
                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
                    >
                        Give Feedback
                    </button>
                </div>
             </div>
        )}
          {/* Display message if feedback submitted (logic from [1]) */}
         {issue.feedbackSubmitted && (
             <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm flex items-center border border-green-200">
                 <HiOutlineCheckCircle className="h-5 w-5 mr-2"/> You have already submitted feedback for this issue. Thank you!
             </div>
         )}


      </div> {/* End max-w-4xl container */}


      {/* MODALS */}
      {/* All modal structures, styling, and internal elements are taken directly from [1] */}

        {/* --- Volunteer Modal --- */}
        {showVolunteerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Register as a Volunteer</h3>
                <p className="text-sm text-gray-600 mb-4">Select the position you want to volunteer for.</p>

                <label htmlFor="volunteer-position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                id="volunteer-position"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                >
                <option value="" disabled>-- Select a Position --</option>
                {/* Filtering logic from [1] */}
                {issue.volunteerPositions
                    ?.filter(p => !p.registeredVolunteers?.includes(user._id) && (p.slots - (p.registeredVolunteers?.length || 0)) > 0)
                    .map((p) => (
                        <option key={p._id} value={p.position}>
                            {p.position} ({p.slots - (p.registeredVolunteers?.length || 0)} slots left)
                        </option>
                ))}
                </select>

                <div className="flex justify-end items-center gap-3">
                <button
                    onClick={() => setShowVolunteerModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={handleVolunteerRegister}
                    disabled={!selectedPosition}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Register
                </button>
                </div>
            </div>
            </div>
        )}

      {/* --- Proof Modal --- */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Submit Proof of Completion</h3>
            <p className="text-sm text-gray-600 mb-4">For task: <span className="font-medium">{selectedTaskForProof?.description}</span></p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="proof-message" className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                    <textarea
                        id="proof-message"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                        placeholder="Add any relevant notes or comments..."
                        value={proofMessage}
                        onChange={(e) => setProofMessage(e.target.value)}
                    />
                 </div>
                 <div>
                     <label htmlFor="proof-files" className="block text-sm font-medium text-gray-700 mb-1">Upload Files (Optional)</label>
                    <input
                        id="proof-files"
                        type="file"
                        multiple
                        onChange={handleProofFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {/* Display selected file names (optional from [1]) */}
                    {proofFiles.length > 0 && (
                         <div className="mt-2 text-xs text-gray-500">
                            Selected: {proofFiles.map(f => f.name).join(', ')}
                         </div>
                     )}
                 </div>
            </div>


            <div className="flex justify-end items-center gap-3 mt-6">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleProofSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Update Modal --- */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Send Update</h3>
             <p className="text-sm text-gray-600 mb-4">Regarding task: <span className="font-medium">{selectedTaskForUpdate?.description}</span></p>

             <div className="space-y-4">
                <div>
                    <label htmlFor="update-title" className="block text-sm font-medium text-gray-700 mb-1">Update Title</label>
                    <input
                        id="update-title"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Progress Update, Roadblock Encountered"
                        value={updateTitle}
                        onChange={(e) => setUpdateTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="update-content" className="block text-sm font-medium text-gray-700 mb-1">Update Content</label>
                    <textarea
                        id="update-content"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Describe the update..."
                        value={updateContent}
                        onChange={(e) => setUpdateContent(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end items-center gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Send Update
              </button>
            </div>
          </div>
        </div>
      )}


       {/* --- Feedback Modal --- */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Submit Feedback</h3>
            <p className="text-sm text-gray-600 mb-4">Your feedback is valuable for improving our service.</p>

            {/* Was it resolved? */}
            <div className="mb-5">
                <p className="block text-sm font-medium text-gray-700 mb-2">Was the reported issue successfully resolved?</p>
                <div className="flex gap-3">
                <button
                    onClick={() => setResolved('Yes')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    resolved === 'Yes' ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    <HiOutlineCheckCircle className="inline mr-1 h-5 w-5"/> Yes, it was resolved
                </button>
                <button
                    onClick={() => setResolved('No')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    resolved === 'No' ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                     <HiOutlineXCircle className="inline mr-1 h-5 w-5"/> No, it was not resolved
                </button>
                </div>
            </div>

             {/* Conditional Fields */}
            <div className="space-y-4 mb-6">
                {/* If Yes */}
                {resolved === 'Yes' && (
                <>
                    <div>
                        <label htmlFor="satisfaction-range" className="block text-sm font-medium text-gray-700 mb-1">
                            Overall Satisfaction: <span className="font-semibold text-blue-600">{satisfaction}/10</span>
                        </label>
                        <input
                            id="satisfaction-range"
                            type="range"
                            min="1"
                            max="10"
                            value={satisfaction}
                            onChange={(e) => setSatisfaction(e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                        />
                    </div>
                    <div>
                         <label htmlFor="suggestions" className="block text-sm font-medium text-gray-700 mb-1">Suggestions for Improvement (Optional)</label>
                        <textarea
                            id="suggestions"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            rows={3}
                            placeholder="Do you have any suggestions on how we could handle similar issues better in the future?"
                            value={suggestions}
                            onChange={(e) => setSuggestions(e.target.value)}
                        />
                    </div>
                </>
                )}

                {/* If No */}
                {resolved === 'No' && (
                <div>
                     {/* Use renamed variable from [1] */}
                    <label htmlFor="issue-problem" className="block text-sm font-medium text-gray-700 mb-1">What went wrong? <span className="text-red-500">*</span></label>
                    <textarea
                        id="issue-problem"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                        placeholder="Please describe why the issue wasn't resolved or what problems occurred."
                        value={issueProblem}
                         // Use renamed variable from [1]
                        onChange={(e) => setIssueProblem(e.target.value)}
                    />
                </div>
                )}
            </div>


            <div className="flex justify-end items-center gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                 // Disable logic from [1]
                disabled={resolved === null || (resolved === 'No' && !issueProblem.trim())}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Optional: Add custom animations if needed (from [1]) */}
        <style jsx>{`
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.3s ease-out forwards;
            }

            /* Custom scrollbar for modals if needed (from [1]) */
             .custom-scrollbar::-webkit-scrollbar { width: 6px; }
             .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
             .custom-scrollbar::-webkit-scrollbar-thumb { background: #a8a8a8; border-radius: 10px; }
             .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #888; }
        `}</style>
    </div> // End min-h-screen container
  );
}

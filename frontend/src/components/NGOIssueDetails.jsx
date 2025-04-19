import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CollaborationDropdown from './CollaborationDropdown';

export default function NGOIssueDetailsPage({ issue: initialIssue }) {
    const [issue, setIssue] = useState(initialIssue);
    const [showVolunteerModal, setShowVolunteerModal] = useState(false);
    const [volunteerPositions, setVolunteerPositions] = useState([{ position: '', slots: '' }]);
    const { user } = useSelector((state) => state.auth);
    const [errors, setErrors] = useState({});
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [taskDescription, setTaskDescription] = useState("");
    const [showProofModal, setShowProofModal] = useState(false);
    const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);
    const [showUpdatesModal, setShowUpdatesModal] = useState(false);
    const [selectedTaskForUpdates, setSelectedTaskForUpdates] = useState(null);

    const handleAddPosition = () => {
        setVolunteerPositions([...volunteerPositions, { position: '', slots: '' }]);
    };

    const handlePositionChange = (index, field, value) => {
        const updatedPositions = [...volunteerPositions];
        updatedPositions[index][field] = value;
        setVolunteerPositions(updatedPositions);
    };

    const handleRemovePosition = (index) => {
        const updatedPositions = volunteerPositions.filter((_, i) => i !== index);
        setVolunteerPositions(updatedPositions);
    };

    const handleSubmitVolunteerRequest = async () => {
        let currentErrors = {};
        volunteerPositions.forEach((pos, index) => {
            if (!pos.position.trim()) {
                currentErrors[`position_${index}`] = 'Position name is required';
            }
            if (!pos.slots || isNaN(pos.slots) || pos.slots <= 0) {
                currentErrors[`slots_${index}`] = 'Please enter a valid number of slots';
            }
        });

        if (Object.keys(currentErrors).length > 0) {
            setErrors(currentErrors);
            return;
        }

        setErrors({});

        try {
            await axios.post('http://localhost:3000/api/v1/issues/submitVolunteerRequest', {
                issueId: issue._id,
                volunteerPositions,
                ngoUsername: user.name,
                ngoUserid: user._id,
                isCollaborator: issue.collaborators && issue.collaborators.some(collab => collab.id === user._id)
            });

            toast.success('Volunteer request submitted successfully!');
            setShowVolunteerModal(false);
            setVolunteerPositions([{ position: '', slots: '' }]);
        } catch (err) {
            console.error(err);
            toast.error('Something went wrong while submitting the volunteer request.');
        }
    };

    const openTaskModal = (volunteer) => {
        setSelectedVolunteer(volunteer);
        setTaskDescription("");
        setShowTaskModal(true);
    };

    const handleAssignTask = async () => {
        try {
            await axios.post("http://localhost:3000/api/v1/issues/assignTask", {
                issueId: issue._id,
                volunteerId: selectedVolunteer._id,
                task: taskDescription,
                assignedBy: {
                    id: user._id,
                    name: user.name
                }
            });
            toast.success("Task assigned successfully!");
            setShowTaskModal(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to assign task.");
        }
    };

    const handleDisclaimIssue = async () => {
        try {
            await axios.post(
                "http://localhost:3000/api/v1/issues/disclaim",
                { issueId: issue._id },
                { withCredentials: true }
            );
            toast.success('Issue disclaimed successfully.');
            setIssue((prev) => ({ ...prev, status: 'Open', assignedNgo: null }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to disclaim issue.');
        }
    };

    const handleMarkAsCompleted = async () => {
        try {
            await axios.post(
                "http://localhost:3000/api/v1/issues/complete",
                { issueId: issue._id },
                { withCredentials: true }
            );
            toast.success('Issue marked as completed.');
            setIssue((prev) => ({ ...prev, status: 'Completed' }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to mark issue as completed.');
        }
    };

    // New: handle accept/reject proof
    const handleAcceptProof = async (taskId) => {
        try {
            await axios.post('http://localhost:3000/api/v1/issues/acceptTaskProof', {
                issueId: issue._id,
                taskId,
                userId: user._id,
                userName: user.name
            });
            toast.success('Task completion proof accepted.');
            setShowProofModal(false);
            // Optionally refresh the issue/task data here
        } catch (err) {
            console.error(err);
            toast.error('Failed to accept proof.');
        }
    };

    const handleRejectProof = async (taskId) => {
        try {
            await axios.post('http://localhost:3000/api/v1/issues/rejectTaskProof', {
                issueId: issue._id,
                taskId,
                userId: user._id,
                userName: user.name
            });
            toast.success('Task completion proof rejected.');
            setShowProofModal(false);
            // Optionally refresh the issue/task data here
        } catch (err) {
            console.error(err);
            toast.error('Failed to reject proof.');
        }
    };

    // Open modals for proof and updates
    const openProofModal = (task) => {
        setSelectedTaskForProof(task);
        setShowProofModal(true);
    };

    const openUpdatesModal = (task) => {
        setSelectedTaskForUpdates(task);
        setShowUpdatesModal(true);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{issue.title}</h1>
                        <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                                issue.status === 'Open' && !issue.assignedTo ? 'bg-green-100 text-green-800' :
                                issue.assignedTo || (issue.collaborators && issue.collaborators.some(collab => collab.id === user._id)) ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {issue.assignedTo || (issue.collaborators && issue.collaborators.some(collab => collab.id === user._id)) ? 'Claimed' : issue.status}
                            </span>
                        </div>
                    </div>
                </div>

                <p className="text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: issue.content }}></p>

                <div className="mb-4">
                    <span className="font-semibold text-gray-800">Location:</span> {issue.issueLocation}
                </div>

                {issue.images && issue.images.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Images</h2>
                        <div className="relative">
                            <img
                                src={issue.images[0]?.url}
                                alt={issue.images[0]?.caption || 'Issue Image'}
                                className="rounded-lg shadow w-full"
                                style={{ height: '300px', objectFit: 'contain', width: '100%' }}
                            />
                            <p className="text-sm text-gray-600 mt-1 text-center">{issue.images[0]?.caption}</p>
                        </div>
                    </div>
                )}

                {issue.assignedTo || (issue.collaborators && issue.collaborators.some(collab => collab.id === user._id)) ? (
                    <div className="mb-6">
                        <CollaborationDropdown
                            issueId={issue._id}
                            assignedNgoId={user._id}
                        />
                        {issue.collaborators && issue.collaborators.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Collaborators</h3>
                                <div className="space-y-2">
                                    {issue.collaborators.map((collaborator, index) => (
                                        <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-medium">
                                                    {collaborator.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-gray-700">{collaborator.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                {issue.volunteerPositions && issue.volunteerPositions.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Volunteer Positions</h2>
                        {issue.volunteerPositions.map((position, index) => (
                            <div key={index} className="mb-4">
                                <div className="text-sm font-medium text-gray-700">
                                    <span className="font-semibold">Position:</span> {position.position}
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                    <span className="font-semibold">Slots Available:</span> {position.slots}
                                </div>
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    <span className="font-semibold">Registered Volunteers:</span>
                                    {position.registeredVolunteers.map((volunteer, i) => (
                                        <div key={i} className="flex flex-col bg-gray-100 px-3 py-2 rounded mt-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-700 font-medium">{volunteer.name}</span>
                                                <button
                                                    className="text-blue-600 text-xs font-medium hover:underline"
                                                    onClick={() => openTaskModal(volunteer)}
                                                >
                                                    Assign Task
                                                </button>
                                            </div>
                                                    {volunteer.tasks && volunteer.tasks.length > 0 ? (
                                                        <div className="mt-2 space-y-2">
                                                            {volunteer.tasks.map((task, taskIdx) => (
                                                                <div key={taskIdx} className="bg-white p-2 rounded shadow text-sm">
                                                                    <p className="text-gray-800"><span className="font-medium">Task:</span> {task.description}</p>
                                                                    <p className="text-gray-600"><span className="font-medium">Status:</span> {task.status}</p>
                                                                    {task.status === "proof submitted" && (
                                                                        <div className="flex gap-2 mt-2">
                                                                            <button
                                                                                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                                                                                onClick={() => openProofModal(task)}
                                                                            >
                                                                                View Task Completion Proof
                                                                            </button>
                                                                            <button
                                                                                className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                                                                                onClick={() => openUpdatesModal(task)}
                                                                            >
                                                                                View Task Updates
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {task.status !== "proof submitted" && (
                                                                        <button
                                                                            className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 mt-2"
                                                                            onClick={() => openUpdatesModal(task)}
                                                                        >
                                                                            View Task Updates
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 mt-1">No tasks assigned yet.</p>
                                                    )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {issue.status === 'Assigned' || (issue.collaborators && issue.collaborators.some(collab => collab.id === user._id)) ? (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowVolunteerModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
                        >
                            Request for Volunteers
                        </button>
                    </div>
                ) : null}

                {issue.status === 'Assigned' || (issue.collaborators && issue.collaborators.some(collab => collab.id === user._id)) ? (
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        {issue.assignedTo === user.name && (
                            <button
                                onClick={handleDisclaimIssue}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
                            >
                                Disclaim Issue
                            </button>
                        )}
                        <button
                            onClick={handleMarkAsCompleted}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg shadow"
                        >
                            Mark as Completed
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Volunteer Modal */}
            {showVolunteerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl px-6 py-8 w-full max-w-lg shadow-2xl relative animate-fade-in-up">
                        <h3 className="text-2xl font-semibold mb-6 text-gray-800">Request Volunteers</h3>
                        {volunteerPositions.map((position, index) => (
                            <div key={index} className="mb-6 border border-gray-200 p-4 rounded-lg shadow-sm bg-gray-50">
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Position</label>
                                    <input
                                        type="text"
                                        value={position.position}
                                        onChange={(e) => handlePositionChange(index, 'position', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Coordinator"
                                    />
                                    {errors[`position_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`position_${index}`]}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Number of Slots</label>
                                    <input
                                        type="number"
                                        value={position.slots}
                                        onChange={(e) => handlePositionChange(index, 'slots', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. 5"
                                    />
                                    {errors[`slots_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`slots_${index}`]}</p>}
                                </div>
                                {volunteerPositions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePosition(index)}
                                        className="text-red-600 text-xs mt-4 hover:underline"
                                    >
                                        Remove this Position
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="mt-4">
                            <button
                                onClick={handleAddPosition}
                                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
                            >
                                ➕ Add Another Position
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-6">
                            <button
                                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                                onClick={() => setShowVolunteerModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                                onClick={handleSubmitVolunteerRequest}
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Assign Modal */}
            {showTaskModal && selectedVolunteer && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl px-6 py-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-xl font-semibold mb-4">Assign Task to {selectedVolunteer.name}</h3>
                        <textarea
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            rows="4"
                            placeholder="Describe the task..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end mt-4 gap-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => setShowTaskModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={handleAssignTask}
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Completion Proof Modal */}
            {showProofModal && selectedTaskForProof && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Task Completion Proof</h3>
                        <div className="mb-2">
                            <span className="font-semibold text-gray-700">Proof Message:</span>
                            <p className="text-gray-800 mt-2">{selectedTaskForProof.proofMessage}</p>
                        </div>
                        {selectedTaskForProof.proofImages && selectedTaskForProof.proofImages.length > 0 && (
                            <div className="mb-4">
                                <span className="font-semibold text-gray-700">Proof Images:</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedTaskForProof.proofImages.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`Proof ${idx + 1}`}
                                            className="w-24 h-24 object-cover rounded"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                                onClick={() => setShowProofModal(false)}
                            >
                                Close
                            </button>
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                onClick={() => handleAcceptProof(selectedTaskForProof._id)}
                            >
                                Accept
                            </button>
                            <button
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                onClick={() => handleRejectProof(selectedTaskForProof._id)}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Updates Modal */}
            {showUpdatesModal && selectedTaskForUpdates && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Task Updates</h3>
                        {selectedTaskForUpdates.updates && selectedTaskForUpdates.updates.length > 0 ? (
                            <ul className="space-y-2">
                                {selectedTaskForUpdates.updates.map((update, idx) => (
                                    <li key={idx} className="border-b pb-2">
                                        <div className="font-semibold text-blue-700">{update.title}</div>
                                        <div className="text-gray-800">{update.content}</div>
                                        <div className="text-xs text-gray-500">
                                            {update.createdAt
                                                ? new Date(update.createdAt).toLocaleString()
                                                : ""}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No updates available for this task.</p>
                        )}
                        <div className="flex justify-end mt-4">
                            <button
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                                onClick={() => setShowUpdatesModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

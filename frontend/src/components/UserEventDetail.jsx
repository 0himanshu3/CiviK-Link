import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    HiLocationMarker, HiCalendar, HiUserGroup, HiOutlineInformationCircle,
    HiArrowLeft, HiArrowRight, HiX, HiCheckCircle, HiBan, HiClock, HiStatusOnline, HiClipboardCheck
} from "react-icons/hi";

export default function UserEventDetails({ event: initialEvent }) {
    const [event, setEvent] = useState(initialEvent);
    const [currentIndex, setCurrentIndex] = useState(0); // For image gallery
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const modalRef = useRef(null); // Ref for the registration modal

    // Effect to handle closing modal on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowRegisterModal(false);
            }
        }
        if (showRegisterModal) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showRegisterModal]);

    // Image Gallery Navigation
    const handleNext = () => {
        if (event.images && currentIndex < event.images.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Registration Modal Logic
    const openRegisterModal = (position) => {
        if (!user) {
            toast.error("Please log in to register for this event");
            navigate("/login");
            return;
        }
        setSelectedPosition(position);
        setShowRegisterModal(true);
    };

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            const response = await fetch(`http://localhost:3000/api/v1/events/${event._id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ positionId: selectedPosition._id }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to register");
            }

            const updatedEventData = await response.json();
            setEvent(updatedEventData.data); // Update local event state
            toast.success("Successfully registered as a volunteer!");
            setShowRegisterModal(false);
        } catch (error) {
            toast.error(error.message || "Registration failed.");
        } finally {
            setIsRegistering(false);
        }
    };

    // Check if the current user is registered for ANY position in this event
    const isUserRegisteredForEvent = event.volunteerPositions?.some(position =>
        position.registeredVolunteers?.includes(user?._id)
    );

    // Helper to format date and time
    const formatDateTime = (dateString) => {
        return dayjs(dateString).format('MMM D, YYYY h:mm A');
    };

    // Helper to get status badge styling
    const getStatusBadge = (status) => {
        const statusClasses = {
            'Upcoming': 'bg-blue-100 text-blue-800',
            'Ongoing': 'bg-green-100 text-green-800',
            'Completed': 'bg-gray-100 text-gray-700',
            'Cancelled': 'bg-red-100 text-red-700'
        };
        return (
            <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-yellow-100 text-yellow-700'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">

                {/* Event Header Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                    <div className="p-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">{event.title}</h1>
                        <div className="flex flex-wrap gap-x-6 gap-y-3 mb-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <HiLocationMarker className="mr-1.5 h-5 w-5 text-blue-500" />
                                <span>{event.eventLocation}</span>
                            </div>
                            <div className="flex items-center">
                                <HiStatusOnline className="mr-1.5 h-5 w-5 text-blue-500" />
                                {getStatusBadge(event.status)}
                            </div>
                            <div className="flex items-center">
                                <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                    {event.category}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                            <div>
                                <div className="flex font-medium text-gray-700 mb-0"><HiCalendar className="mr-1.5 h-4 w-4" /> Start: {formatDateTime(event.eventStartDate)}</div>
                                
                            </div>
                            <div>
                                <div className="flex items-center font-medium text-gray-700 mb-0"><HiClock className="mr-1.5 h-4 w-4" /> End: {formatDateTime(event.eventEndDate)}</div>
                                
                            </div>
                        </div>
                        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 mt-4" dangerouslySetInnerHTML={{ __html: event.description }}></div>
                    </div>

                    {/* Image Gallery */}
                    {event.images && event.images.length > 0 && (
                        <div className="border-t border-gray-200">
                            <div className="p-6">
                                <h2 className="text-lg font-semibold mb-3 text-gray-700">Images</h2>
                                <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                                    <img
                                        src={event.images[currentIndex]?.url}
                                        alt={event.images[currentIndex]?.caption || `Event image ${currentIndex + 1}`}
                                        className="mx-auto rounded"
                                        style={{ maxHeight: '350px', objectFit: 'contain', width: '100%' }}
                                    />
                                    {event.images.length > 1 && (
                                        <>
                                            <button
                                                className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-40 p-2 rounded-full text-white hover:bg-opacity-60 transition"
                                                onClick={handlePrevious}
                                                aria-label="Previous image"
                                            >
                                                <HiArrowLeft className="h-5 w-5" />
                                            </button>
                                            <button
                                                className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-40 p-2 rounded-full text-white hover:bg-opacity-60 transition"
                                                onClick={handleNext}
                                                aria-label="Next image"
                                            >
                                                <HiArrowRight className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                    {event.images[currentIndex]?.caption && (
                                        <p className="text-xs text-gray-600 mt-2 text-center italic">{event.images[currentIndex].caption}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Organizer Info */}
                    <div className="border-t border-gray-200 p-6">
                         <h2 className="text-lg font-semibold mb-2 text-gray-700">Organized by</h2>
                         <div className="flex items-center">
                             <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
                                 {/* Generic Org Icon */}
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                 </svg>
                             </div>
                             <p className="font-medium text-gray-800">{event.createdBy?.name || "NGO Organization"}</p>
                         </div>
                     </div>
                </div>

                {/* Volunteer Positions Card */}
                {event.volunteerPositions && event.volunteerPositions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <HiUserGroup className="h-6 w-6 text-blue-500 mr-2" />
                                <h2 className="text-xl font-semibold text-gray-800">Volunteer Positions</h2>
                            </div>
                            <div className="space-y-3">
                                {event.volunteerPositions.map((position, idx) => {
                                    const isPositionFull = position.registeredVolunteers?.length >= position.slots;
                                    const isUserRegisteredForThisPosition = position.registeredVolunteers?.includes(user?._id);
                                    const canRegister = event.status === 'Upcoming' && !isUserRegisteredForEvent && !isPositionFull;

                                    return (
                                        <div key={position._id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                            <div>
                                                <h3 className="font-medium text-lg text-gray-800">{position.position}</h3>
                                                <span className="text-sm text-gray-600 mt-1">
                                                    Slots: {position.registeredVolunteers?.length || 0} / {position.slots} filled
                                                </span>
                                            </div>
                                            <div className="mt-3 sm:mt-0 flex-shrink-0">
                                                {isUserRegisteredForThisPosition ? (
                                                    <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                        <HiCheckCircle className="mr-1.5 h-5 w-5" /> Registered
                                                    </div>
                                                ) : isUserRegisteredForEvent ? (
                                                     <div className="inline-flex items-center bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                        <HiOutlineInformationCircle className="mr-1.5 h-5 w-5" /> Already registered for this event
                                                    </div>
                                                ) : isPositionFull ? (
                                                    <div className="inline-flex items-center bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                        <HiBan className="mr-1.5 h-5 w-5" /> Position Full
                                                    </div>
                                                ) : event.status !== 'Upcoming' ? (
                                                    <div className="inline-flex items-center bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                        <HiClock className="mr-1.5 h-5 w-5" /> Registration Closed
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => openRegisterModal(position)}
                                                        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition"
                                                    >
                                                        Register
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-8">
                    <Link
                        to="/events"
                        className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow-sm transition"
                    >
                         <HiArrowLeft className="mr-1.5 h-5 w-5"/> Back to Events
                    </Link>
                    {isUserRegisteredForEvent && event.status !== 'Completed' && (
                        <Link
                            to="/dashboard/my-events"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
                        >
                             <HiClipboardCheck className="mr-1.5 h-5 w-5"/> View My Registrations
                        </Link>
                    )}
                </div>
            </div>

            {/* Registration Confirmation Modal */}
            {showRegisterModal && selectedPosition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div ref={modalRef} className="bg-white rounded-xl p-6 w-full max-w-md relative shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Confirm Registration</h3>
                            <button onClick={() => setShowRegisterModal(false)} className="text-gray-500 hover:text-gray-700"><HiX className="h-6 w-6"/></button>
                        </div>
                        <div className="mb-4 space-y-1">
                            <p><span className="font-medium">Event:</span> {event.title}</p>
                            <p><span className="font-medium">Position:</span> {selectedPosition.position}</p>
                            <p className="text-sm text-gray-600">Available Slots: {selectedPosition.slots - (selectedPosition.registeredVolunteers?.length || 0)}</p>
                        </div>
                        <p className="mb-6 text-gray-700 text-sm">
                            By clicking "Confirm", you commit to attending this event and fulfilling the responsibilities of this volunteer position.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                                onClick={() => setShowRegisterModal(false)}
                                disabled={isRegistering}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center"
                                onClick={handleRegister}
                                disabled={isRegistering}
                            >
                                {isRegistering ? (
                                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                     </svg>
                                ) : (
                                    <HiCheckCircle className="mr-1.5 h-5 w-5" />
                                )}
                                {isRegistering ? "Registering..." : "Confirm Registration"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

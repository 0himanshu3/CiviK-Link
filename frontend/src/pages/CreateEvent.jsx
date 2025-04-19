import React, { useState, useRef, useEffect } from "react";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LocationPicker from "../components/LocationPicker";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const eventCategories = ["Blood Donation", "Health Camp", "Education", "Environment", "Food Distribution", "Fundraising", "Awareness"];

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    eventLocation: "",
    eventStartDate: null,
    eventEndDate: null,
  });
  const [volunteerPositions, setVolunteerPositions] = useState([
    { position: "", slots: "" }
  ]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);

  const categoryDropdownRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryDropdownRef]);

  const handleQuillChange = (value) => {
    setFormData({ ...formData, description: value });
  };

  const handlePositionChange = (index, field, value) => {
    const updatedPositions = [...volunteerPositions];
    updatedPositions[index][field] = value;
    setVolunteerPositions(updatedPositions);
  };

  const addPositionField = () => {
    setVolunteerPositions([...volunteerPositions, { position: "", slots: "" }]);
  };

  const removePositionField = (index) => {
    if (volunteerPositions.length <= 1) return;
    const updatedPositions = volunteerPositions.filter((_, i) => i !== index);
    setVolunteerPositions(updatedPositions);
  };

  const uploadFiles = async (list) => {
    const storage = getStorage(app);
    const results = [];
    for (let item of list) {
      const fileName = `${Date.now()}-${item.file.name}`;
      const storageRef = ref(storage, fileName);
      const task = uploadBytesResumable(storageRef, item.file);
      await new Promise((resolve) => {
        task.on(
          "state_changed",
          null,
          () => {
            results.push({ ...item, error: "Upload failed" });
            resolve();
          },
          () => {
            getDownloadURL(task.snapshot.ref).then((url) => {
              results.push({ url, fileName });
              resolve();
            });
          }
        );
      });
    }
    return results;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setImageUploading(true);
    const list = files.map((file) => ({ file }));
    const uploaded = await uploadFiles(list);
    setImages((prev) => [...prev, ...uploaded]);
    setImageUploading(false);
    setImageUploadSuccess(true);
    setTimeout(() => setImageUploadSuccess(false), 3000);

    toast.success('Images uploaded successfully!');
  };
  
  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setVideoUploading(true);
    const list = files.map((file) => ({ file }));
    const uploaded = await uploadFiles(list);
    setVideos((prev) => [...prev, ...uploaded]);
    setVideoUploading(false);
    setVideoUploadSuccess(true);
    setTimeout(() => setVideoUploadSuccess(false), 3000);
    
    toast.success('Videos uploaded successfully!');
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveVideo = (indexToRemove) => {
    setVideos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const validateForm = () => {
    if (!formData.title || !formData.category || !formData.description || !formData.eventLocation || !formData.eventStartDate || !formData.eventEndDate) {
      setPublishError("Please fill in all required fields.");
      return false;
    }

    if (new Date(formData.eventStartDate) > new Date(formData.eventEndDate)) {
      setPublishError("End date must be after start date.");
      return false;
    }

    // Validate volunteer positions
    for (const position of volunteerPositions) {
      if (!position.position.trim() || !position.slots || isNaN(position.slots) || parseInt(position.slots) <= 0) {
        setPublishError("Please fill in all volunteer position details with valid slots.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setPublishError(null);
    setIsSubmitting(true);
    
    try {
      const body = {
        ...formData,
        images: images.map((i) => ({ url: i.url })),
        videos: videos.map((v) => ({ url: v.url })),
        volunteerPositions,
        createdBy: user._id,
      };

      const res = await fetch("http://localhost:3000/api/v1/events/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Event created successfully!");
        navigate("/ngo-dashboard/created-events");
      } else {
        const data = await res.json();
        console.error("Error response:", data);
        setPublishError(data.message || "Failed to create event. Please try again.");
        toast.error(data.message || "Failed to create event. Please try again.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setPublishError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-blue-600 py-6 px-8">
          <h1 className="text-3xl font-bold text-white text-center">Create New Event</h1>
          <p className="text-blue-100 text-center mt-2">Fill in the details to create your event</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Title Section */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-lg font-semibold text-gray-700 block">
              Event Title
            </label>
            <input
              id="title"
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter a descriptive title for your event"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Category Section */}
          <div className="space-y-2 relative">
            <label className="text-lg font-semibold text-gray-700 block">
              Event Category
            </label>
            <div
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 flex items-center justify-between cursor-pointer hover:border-blue-500 transition-all"
            >
              <span className={formData.category ? "text-gray-900" : "text-gray-500"}>
                {formData.category || "Select category..."}
              </span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showCategoryDropdown && (
              <div ref={categoryDropdownRef} 
                   className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
                {eventCategories.map((category) => (
                  <div
                    key={category}
                    onClick={() => {
                      setFormData({ ...formData, category });
                      setShowCategoryDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    {category}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <label className="text-lg font-semibold text-gray-700 block">
              Event Description
            </label>
            <div className="rounded-lg overflow-hidden border border-gray-300">
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleQuillChange}
                placeholder="Describe your event in detail..."
                modules={{
                  toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                    ['link'],
                    ['clean'],
                  ],
                }}
                className="bg-white h-48"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-2">
            <label className="text-lg font-semibold text-gray-700 block">
              Event Location
            </label>
            <div className="rounded-lg overflow-hidden border border-gray-300">
              <LocationPicker
                eventLocation={formData.eventLocation}
                setEventLocation={(loc) => setFormData({ ...formData, eventLocation: loc })}
              />
            </div>
          </div>

          {/* Date Selection Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-lg font-semibold text-gray-700 block">
                Start Date & Time
              </label>
              <DatePicker
                selected={formData.eventStartDate}
                onChange={(date) => setFormData({ ...formData, eventStartDate: date })}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={new Date()}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholderText="Select start date and time"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-lg font-semibold text-gray-700 block">
                End Date & Time
              </label>
              <DatePicker
                selected={formData.eventEndDate}
                onChange={(date) => setFormData({ ...formData, eventEndDate: date })}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={formData.eventStartDate || new Date()}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholderText="Select end date and time"
                required
              />
            </div>
          </div>

          {/* Volunteer Positions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-700">
                Volunteer Positions
              </label>
              <button
                type="button"
                onClick={addPositionField}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Position
              </button>
            </div>
            <div className="space-y-4">
              {volunteerPositions.map((position, index) => (
                <div key={index} 
                     className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={position.position}
                        onChange={(e) => handlePositionChange(index, "position", e.target.value)}
                        placeholder="Position title"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="number"
                        value={position.slots}
                        onChange={(e) => handlePositionChange(index, "slots", e.target.value)}
                        placeholder="Number of slots"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required
                      />
                    </div>
                    {volunteerPositions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePositionField(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Upload Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Images Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold text-gray-700">Images</label>
                <button
                  type="button"
                  onClick={() => imageInputRef.current.click()}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                    imageUploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Images
                    </>
                  )}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageUpload}
                />
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img
                        src={img.url}
                        alt={`uploaded-${idx}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Videos Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold text-gray-700">Videos</label>
                <button
                  type="button"
                  onClick={() => videoInputRef.current.click()}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                    videoUploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  disabled={videoUploading}
                >
                  {videoUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Upload Videos
                    </>
                  )}
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  hidden
                  onChange={handleVideoUpload}
                />
              </div>
              {videos.length > 0 && (
                <div className="space-y-2">
                  {videos.map((video, idx) => (
                    <div key={idx} 
                         className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                      <a href={video.url} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[80%]">
                        {decodeURIComponent(video.url.split('/').pop().split('?')[0])}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold text-lg transition-colors ${
                isSubmitting 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating Event...
                </span>
              ) : (
                "Create Event"
              )}
            </button>
          </div>

          {/* Error Message */}
          {publishError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{publishError}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

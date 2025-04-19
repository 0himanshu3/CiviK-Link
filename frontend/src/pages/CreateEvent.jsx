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
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">Create New Event</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block font-medium mb-1">Title</label>
            <input
              id="title"
              type="text"
              className="w-full border border-gray-300 rounded p-2"
              placeholder="Event title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <label className="block font-medium mb-1">Category</label>
            <div
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full border border-gray-300 rounded p-2 flex items-center justify-between cursor-pointer"
            >
              {formData.category ? (
                <span>{formData.category}</span>
              ) : (
                <span className="text-gray-500">Select category...</span>
              )}
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            {showCategoryDropdown && (
              <div
                ref={categoryDropdownRef}
                className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-48 overflow-y-auto"
              >
                {eventCategories.map((category) => (
                  <div
                    key={category}
                    onClick={() => {
                      setFormData({ ...formData, category });
                      setShowCategoryDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {category}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={handleQuillChange}
              placeholder="Describe the event in detail..."
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                  ['link', 'image'],
                  ['clean'],
                ],
              }}
              formats={[
                'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
                'list', 'bullet', 'indent', 'link', 'image',
              ]}
              className="bg-white"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Location / Address</label>
            <LocationPicker
              eventLocation={formData.eventLocation}
              setEventLocation={(loc) => setFormData({ ...formData, eventLocation: loc })}
            />
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Start Date</label>
              <DatePicker
                selected={formData.eventStartDate}
                onChange={(date) => setFormData({ ...formData, eventStartDate: date })}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={new Date()}
                className="w-full border border-gray-300 rounded p-2"
                placeholderText="Select start date and time"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">End Date</label>
              <DatePicker
                selected={formData.eventEndDate}
                onChange={(date) => setFormData({ ...formData, eventEndDate: date })}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={formData.eventStartDate || new Date()}
                className="w-full border border-gray-300 rounded p-2"
                placeholderText="Select end date and time"
                required
              />
            </div>
          </div>

          {/* Volunteer Positions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-medium">Volunteer Positions</label>
              <button
                type="button"
                onClick={addPositionField}
                className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
              >
                + Add Position
              </button>
            </div>
            <div className="space-y-3">
              {volunteerPositions.map((position, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border border-gray-200 rounded bg-gray-50">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={position.position}
                      onChange={(e) => handlePositionChange(index, "position", e.target.value)}
                      placeholder="Position title"
                      className="w-full border border-gray-300 rounded p-2 mb-2"
                      required
                    />
                    <input
                      type="number"
                      value={position.slots}
                      onChange={(e) => handlePositionChange(index, "slots", e.target.value)}
                      placeholder="Number of slots"
                      className="w-full border border-gray-300 rounded p-2"
                      min="1"
                      required
                    />
                  </div>
                  {volunteerPositions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePositionField(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-medium">Images</label>
              <button
                type="button"
                onClick={() => imageInputRef.current.click()}
                className="bg-blue-600 text-white px-4 py-1.5 text-sm rounded hover:bg-blue-700"
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload Images'
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
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded overflow-hidden border border-gray-300 shadow-sm group"
                  >
                    <img
                      src={img.url}
                      alt={`uploaded-${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Upload Section */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-medium">Videos</label>
              <button
                type="button"
                onClick={() => videoInputRef.current.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={videoUploading}
              >
                {videoUploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload Videos'
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
              <div className="mt-4 space-y-2">
                {videos.map((video, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded shadow text-sm">
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {decodeURIComponent(video.url.split('/').pop().split('?')[0])}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(idx)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded text-white font-semibold ${
              isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>

          {publishError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mt-2 text-center">
              {publishError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

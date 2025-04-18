import React, { useState, useRef, useEffect } from "react";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LocationPicker from "../components/LocationPicker";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-hot-toast";

const issueTags = ["Road", "Water", "Electricity", "Education", "Health", "Sanitation"];

export default function PostIssue() {
  const [formData, setFormData] = useState({
    title: "",
    tags: [],
    content: "",
    issueLocation: "",
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);

  const tagDropdownRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Close tag dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setShowTagDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tagDropdownRef]);

  const toggleTag = (tag) => {
    setFormData((prev) => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  const handleQuillChange = (value) => {
    setFormData({ ...formData, content: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.tags.length === 0 || !formData.content || !formData.issueLocation) {
      setPublishError("Please fill in all required fields.");
      return;
    }

    setPublishError(null);
    setIsSubmitting(true);
    try {
      const body = {
        ...formData,
        images: images.map((i) => ({ url: i.url })),
        videos: videos.map((v) => ({ url: v.url })),
        postedBy: user._id,
      };

      const res = await fetch("http://localhost:3000/api/v1/issues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        toast.success("Issue posted successfully!");
        navigate("/dashboard/created-issues"); // Navigate to Created Issues section
      } else {
        const data = await res.json();
        setPublishError(data.message || "Failed to post issue.");
      }
    } catch (error) {
      console.error("Error posting issue:", error);
      setPublishError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">Post an Issue</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block font-medium mb-1">Title</label>
            <input
              id="title"
              type="text"
              className="w-full border border-gray-300 rounded p-2"
              placeholder="Issue title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Tags Dropdown */}
          <div className="relative">
            <label className="block font-medium mb-1">Tags</label>
            <div
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="w-full border border-gray-300 rounded p-2 flex flex-wrap gap-2 cursor-pointer"
            >
              {formData.tags.length > 0 ? (
                formData.tags.map((tag) => (
                  <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">Select tags...</span>
              )}
            </div>
            {showTagDropdown && (
              <div
                ref={tagDropdownRef}
                className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-48 overflow-y-auto"
              >
                {issueTags.map((tag) => (
                  <div
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag)}
                      readOnly
                      className="mr-2"
                    />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={handleQuillChange}
              placeholder="Describe the issue in detail..."
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
              eventLocation={formData.issueLocation}
              setEventLocation={(loc) => setFormData({ ...formData, issueLocation: loc })}
            />
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
            {isSubmitting ? "Posting..." : "Post Issue"}
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

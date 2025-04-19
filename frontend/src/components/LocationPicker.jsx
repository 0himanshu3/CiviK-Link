import React, { useState } from 'react';

const LocationPicker = ({ onLocationSelect, value }) => {
  const [location, setLocation] = useState(value || '');

  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    if (onLocationSelect) {
      onLocationSelect(newLocation);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Location
      </label>
      <input
        type="text"
        value={location}
        onChange={handleLocationChange}
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your location"
        required
      />
    </div>
  );
};

export default LocationPicker; 
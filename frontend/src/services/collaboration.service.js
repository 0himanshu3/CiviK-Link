import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1/collaboration';

// Send collaboration request
export const sendCollaborationRequest = async (issueId, ngoId, message) => {
  try {
    console.log('Sending collaboration request:', { issueId, ngoId, message });
    const response = await axios.post(`${API_URL}/request`, {
      issueId,
      ngoId,
      message
    }, {
      withCredentials: true
    });

    console.log('Collaboration request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending collaboration request:', error);
    throw error.response?.data || { message: error.message };
  }
};

// Get collaboration requests for an NGO
export const getCollaborationRequests = async () => {
  try {
    const response = await axios.get(`${API_URL}/requests`, {
      withCredentials: true
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching collaboration requests:', error);
    throw error.response?.data || { message: error.message };
  }
};

// Respond to collaboration request
export const respondToRequest = async (requestId, status) => {
  try {
    const response = await axios.patch(`${API_URL}/request/${requestId}/respond`, {
      status
    }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error responding to request:', error);
    throw error.response?.data || { message: error.message };
  }
}; 
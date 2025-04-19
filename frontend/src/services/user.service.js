import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1/users';

export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/${userId}`, {
      withCredentials: true
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error.response?.data || { message: error.message };
  }
}; 
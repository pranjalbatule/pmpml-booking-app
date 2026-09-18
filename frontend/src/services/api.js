import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const searchRoutes = async (source, destination) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/routes/search`, {
      params: { source, destination }
    });
    return response.data;
  } catch (error) {
    console.error("Error searching routes:", error);
    throw error;
  }
};
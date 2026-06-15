import axios from 'axios';

const API = axios.create({
  
  baseURL: 'http://192.168.1.19:5000/api', 
});

// Fetch all maintenance jobs
export const fetchRequests = async () => {
  try {
    const response = await API.get('/requests');
    return response.data;
  } catch (error) {
    console.error("Fetch Error:", error.message);
    throw error;
  }
};

// Send new job to database
export const createRequest = async (requestData) => {
  try {
    const response = await API.post('/requests', requestData);
    return response.data;
  } catch (error) {
    // This logs the specific error from MongoDB or Express
    console.error("Submission Error:", error.response?.data || error.message);
    throw error;
  }
};

export default API;
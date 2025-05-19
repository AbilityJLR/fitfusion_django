import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

axios.defaults.withCredentials = true;

let isRequestInProgress = false;

export default async function getRecommendations() {
  if (isRequestInProgress) {
    console.log('Recommendation request already in progress, skipping duplicate call');
    return null;
  }

  try {
    isRequestInProgress = true;
    console.log('Fetching recommendations from:', `${API_URL}/api/recommendations/`);
    
    const response = await axios.post(`${API_URL}/api/recommendations/`, {}, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Recommendations received:', response.status);
    return response.data;
  } catch (error) {
    console.error('Error loading recommendations:', error);
    
    if (error.response && error.response.status === 401) {
      console.error('Authentication failed. User may need to login again.');
      // You might want to redirect to login page here or handle this in your UI
    }
    
    throw error;
  } finally {
    isRequestInProgress = false;
  }
}

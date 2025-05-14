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
    const response = await axios.post(`${API_URL}/api/recommendations/`)
    console.log(response)
    return response.data
  } catch (error) {
    console.log(error)
    throw error
  } finally {
    isRequestInProgress = false;
  }
}

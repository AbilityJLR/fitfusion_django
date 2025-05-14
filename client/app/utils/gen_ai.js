import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

axios.defaults.withCredentials = true;

let isRequestInProgress = false;

export default async function getGenAI(query) {
  if (isRequestInProgress) {
    console.log('chat request already in progress, skipping duplicate call');
    return null;
  }

  try {
    isRequestInProgress = true;
    const response = await axios.post(`${API_URL}/api/chat/`, { query: query })
    console.log(response)
    return response.data
  } catch (error) {
    console.log(error)
    throw error
  } finally {
    isRequestInProgress = false;
  }
}

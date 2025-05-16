import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

axios.defaults.withCredentials = true;

let isRequestInProgress = false;

export default async function getGenAI(query, onStreamUpdate) {
  if (isRequestInProgress) {
    console.log('chat request already in progress, skipping duplicate call');
    return null;
  }

  try {
    isRequestInProgress = true;
    const response = await axios.post(`${API_URL}/api/chat/`, 
      { query: query },
      { 
        responseType: 'text',
        onDownloadProgress: (progressEvent) => {
          const text = progressEvent.event.target.responseText;
          if (text && onStreamUpdate) {
            onStreamUpdate(text);
          }
        }
      }
    );
    
    return { reply: response.data };
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    isRequestInProgress = false;
  }
}

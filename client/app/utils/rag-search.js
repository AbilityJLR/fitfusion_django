import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitfusion-backend-ocl4.onrender.com';

export const getSearch = async (query, contentType = '', difficultyLevel = '') => {
  try {
    const params = new URLSearchParams();
    params.append('query', query);
    if (contentType) params.append('content_type', contentType);
    if (difficultyLevel) params.append('difficulty_level', difficultyLevel);
    
    const response = await axios({
      method: 'get',
      url: `${API_URL}/api/fitness-content/search/`,
      params: params,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });
    
    return response.data.results || [];
  } catch (error) {
    console.error('Search error:', error);
    
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        return []; // Return empty results for unauthorized
      }
      throw new Error(error.response.data?.message || 'Server error occurred');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error('Error setting up the request');
    }
  }
};

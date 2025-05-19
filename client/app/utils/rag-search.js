import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getSearch = async (query, contentType = '', difficultyLevel = '') => {
  try {
    const params = new URLSearchParams();
    params.append('query', query);
    if (contentType) params.append('content_type', contentType);
    if (difficultyLevel) params.append('difficulty_level', difficultyLevel);
    
    // First try with credentials
    try {
      const response = await axios.get(`${API_URL}/api/fitness-content/search/?${params.toString()}`, {
        withCredentials: true
      });
      return response.data.results || [];
    } catch (credentialError) {
      console.warn('Search with credentials failed, trying without credentials:', credentialError);
      // If that fails, try without credentials since we've made the endpoint public
      const fallbackResponse = await axios.get(`${API_URL}/api/fitness-content/search/?${params.toString()}`, {
        withCredentials: false
      });
      return fallbackResponse.data.results || [];
    }
  } catch (error) {
    console.error('Search error:', error);
    throw new Error(error.response?.data?.message || 'An error occurred while searching');
  }
};

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

axios.defaults.withCredentials = true;

export const getSearch = async (query, contentType = '', difficultyLevel = '') => {
  try {
    const params = new URLSearchParams();
    params.append('query', query);
    if (contentType) params.append('content_type', contentType);
    if (difficultyLevel) params.append('difficulty_level', difficultyLevel);

    const response = await axios.get(`${API_URL}/api/fitness-content/search/?${params.toString()}`, {
      withCredentials: true
    });

    return response.data.results || [];
  } catch (error) {
    console.error('Search error:', error);
    throw new Error(error.response?.data?.message || 'An error occurred while searching');
  }
};

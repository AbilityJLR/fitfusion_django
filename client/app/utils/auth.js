import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

axios.defaults.withCredentials = true;

export const setupAxiosInterceptors = () => {
  // Remove any existing interceptors
  axios.interceptors.request.eject(axios.interceptors.request.handlers?.[0]);
  axios.interceptors.response.eject(axios.interceptors.response.handlers?.[0]);
  
  // Add request interceptor to ensure CORS credentials are sent
  axios.interceptors.request.use(
    (config) => {
      config.withCredentials = true;
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor to handle auth errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }
      
      console.log('Authentication error detected');
      // Could implement token refresh logic here if needed
      
      return Promise.reject(error);
    }
  );
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/api/register/`, userData, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    let errorMessage = 'Registration failed';

    if (error.response && error.response.data) {
      if (typeof error.response.data === 'object') {
        const errorDetails = [];
        for (const [field, messages] of Object.entries(error.response.data)) {
          if (Array.isArray(messages)) {
            errorDetails.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorDetails.push(`${field}: ${messages}`);
          }
        }
        if (errorDetails.length > 0) {
          errorMessage = errorDetails.join('\n');
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      } else {
        errorMessage = error.response.data;
      }
    } else if (error.request) {
      errorMessage = 'Network error: No response from server';
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/token/`, {
      username,
      password
    });
    
    console.log('Login successful');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || 'Authentication failed'
    };
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_URL}/api/logout/`);
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
};

export const isAuthenticated = async () => {
  try {
    await axios.get(`${API_URL}/api/profile/detail/`);
    return true;
  } catch (error) {
    return false;
  }
};

export const initAuth = () => {
  setupAxiosInterceptors();
  return true;
}; 

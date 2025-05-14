import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

/**
 * Setup axios interceptors for handling token refreshing and auth errors
 */
export const setupAxiosInterceptors = () => {
  // Response interceptor for handling auth errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Return error directly if it's not an auth error
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }
      
      // If refresh token handling is needed, it can be added here
      return Promise.reject(error);
    }
  );
};

/**
 * Login user with credentials
 * This uses cookies set by the backend so we don't need to store tokens
 */
export const login = async (username, password) => {
  try {
    await axios.post(`${API_URL}/api/token/`, {
      username,
      password
    });

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Authentication failed'
    };
  }
};

/**
 * Logout user by calling the logout endpoint which clears cookies
 */
export const logout = async () => {
  try {
    await axios.post(`${API_URL}/api/logout/`);
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
};

/**
 * Check if user is authenticated by making a request to a protected endpoint
 */
export const isAuthenticated = async () => {
  try {
    // Make a request to a protected endpoint
    await axios.get(`${API_URL}/api/profile/detail/`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Initialize authentication
 * No need to do anything since cookies are automatically sent with requests
 */
export const initAuth = () => {
  // Setup axios interceptors for auth
  setupAxiosInterceptors();
  // Nothing else needed since cookies are handled by the browser
  return true;
}; 

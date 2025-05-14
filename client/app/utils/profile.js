import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

axios.defaults.withCredentials = true;

export const getProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

export const getPhysicalProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/physical/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching physical profile:', error);
    throw error;
  }
}

export const getFitnessProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/fitness/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching fitness profile:', error);
    throw error;
  }
}

export const getDietaryProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/dietary/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dietary profile:', error);
    throw error;
  }
}

export const getProfileSetupData = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/setup/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile setup data:', error);
    throw error;
  }
}

export const setupProfiles = async (profileData) => {
  try {
    const response = await axios.post(`${API_URL}/api/profile/setup/`, profileData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error setting up profiles:', error);
    throw error;
  }
}

export const getUserDetails = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/profile/detail/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
}

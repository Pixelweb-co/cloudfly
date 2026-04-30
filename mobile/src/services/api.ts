import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Update with the actual API URL (e.g. from environment variables)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.cloudfly.com.co';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle unauthorized errors (e.g., redirect to login)
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('userToken');
      // Here we might dispatch a logout action if using a global navigator ref or a Redux listener
    }
    return Promise.reject(error);
  }
);

export default api;

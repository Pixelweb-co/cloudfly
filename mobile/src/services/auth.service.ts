import api from './api';

export const AuthService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Example for fetching user profile or checking session validation if needed
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

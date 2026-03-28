// Profile Service
import api from './api';

export const getProfile = () => api.get('/auth/me');
export const updateProfile = (data) => api.patch('/auth/me', data);

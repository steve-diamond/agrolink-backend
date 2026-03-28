// Settings Service
import api from './api';

export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.patch('/settings', data);

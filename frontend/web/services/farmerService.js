// Farmer Service
import api from './api';

export const getFarmerDashboard = () => api.get('/dashboard/farmer');

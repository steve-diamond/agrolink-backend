// Payment Service
import api from './api';

export const initializePayment = (data) => api.post('/payment/initialize', data);
export const verifyPayment = (reference) => api.get(`/payment/verify/${reference}`);

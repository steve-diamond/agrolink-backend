// Product Service
import api from './api';

export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);

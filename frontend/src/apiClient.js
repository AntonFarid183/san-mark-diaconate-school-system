import axios from 'axios';
import { BACKEND_URL } from './config';

// Backend origin is environment-driven (see config.js) so the same build
// process works against localhost in dev and the real API in production —
// this used to be hardcoded to localhost, which would've silently pointed
// a deployed frontend at nothing.
const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. The Interceptor: Automatically fires BEFORE the request leaves the browser
apiClient.interceptors.request.use(
  (config) => {
    // Safely check if the user has successfully logged in before
    const token = localStorage.getItem('token');
    
    // Un-lock the backend by presenting the 'Bearer' token passport
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

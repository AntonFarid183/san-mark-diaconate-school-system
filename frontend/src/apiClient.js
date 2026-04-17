import axios from 'axios';

// 1. Bind strictly to your local .NET API Port
const apiClient = axios.create({
  baseURL: 'http://localhost:5016/api',
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

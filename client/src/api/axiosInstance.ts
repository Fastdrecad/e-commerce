import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
const tokenStorageKey = "config.tokenStorageKey";

const axiosInstance = axios.create({
  baseURL: apiUrl,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(tokenStorageKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error("Error", 401);
          break;
        case 403:
          console.error("Error", 403);
          break;
        case 404:
          console.error("Error", 404);
          break;
        case 500:
          console.error("Error", 500);
          break;
        default:
          console.error("Error with API");
      }
    } else if (error.request) {
      console.error("Error");
    }
    console.error(error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;

import axios from "axios";

// Modify this key to match how you store tokens
const apiUrl = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: apiUrl
});

export const setBearerToken = (token: string) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

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

import axios from "axios";

const instance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://tradalystbackend-chantabbai07ai.replit.app" ||
    "https://52c8265e-6e58-4fdf-ad64-fa60ff0fb5b8-00-3o6lyfavjj71.riker.replit.dev/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
  },
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 502) {
      console.error("Backend server error:", error);
    }
    return Promise.reject(error);
  },
);

export default instance;

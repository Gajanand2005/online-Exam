import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("teacherToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/")) {
      let user;
      try {
        user = JSON.parse(localStorage.getItem("teacherUser") || "null");
      } catch {
        user = null;
      }
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("teacherUser");
      const loginPath = user?.role === "principal" ? "/principal-login" : "/teacher-login";
      if (window.location.pathname !== loginPath) window.location.assign(loginPath);
    }
    return Promise.reject(error);
  }
);

export default api;

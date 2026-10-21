import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://aibus.shop").replace(/\/$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

// Request Interceptor: Automatically attach Auth Token & Idempotency Key
api.interceptors.request.use(
  (config) => {
    try {
      const authData = localStorage.getItem("aibus_auth_tokens");
      if (authData) {
        const { accessToken } = JSON.parse(authData);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          config.headers["access-token"] = accessToken;
        }
      }
    } catch {
      // Ignore token read error
    }

    if (config.method === "post" && !config.headers["Idempotency-Key"]) {
      config.headers["Idempotency-Key"] = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardized error extraction & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Optional 401 token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const authData = localStorage.getItem("aibus_auth_tokens");
        if (authData) {
          const { refreshToken } = JSON.parse(authData);
          if (refreshToken) {
            const refreshRes = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
            const newTokens = refreshRes.data?.data;
            if (newTokens?.accessToken) {
              localStorage.setItem("aibus_auth_tokens", JSON.stringify(newTokens));
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              originalRequest.headers["access-token"] = newTokens.accessToken;
              return api(originalRequest);
            }
          }
        }
      } catch {
        localStorage.removeItem("aibus_auth_tokens");
      }
    }

    const errData = error.response?.data;
    const message =
      (typeof errData?.error === "string"
        ? errData.error
        : errData?.error?.message) ||
      errData?.message ||
      (typeof errData === "string" ? errData : null) ||
      error.message ||
      "An unexpected network error occurred. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;
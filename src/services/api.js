import axios from "axios";

const isLocalDev =
  Boolean(import.meta.env.DEV) ||
  (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local") ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname)));

const rawBase = (import.meta.env.VITE_API_BASE_URL || "https://aibus.shop")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/$/, "");

export const BASE_URL = isLocalDev ? "" : rawBase;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
  withCredentials: true,
});

/**
 * Safely decodes a JWT payload without external dependencies
 */
export const parseJwt = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    try {
      const parts = token.split(".");
      return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
      return null;
    }
  }
};

/**
 * Returns remaining milliseconds until the access token expires.
 * Returns 0 if expired or unparseable.
 */
export const getAccessTokenRemainingMs = (token) => {
  if (!token) return 0;
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return 0;
  return decoded.exp * 1000 - Date.now();
};

let refreshPromise = null;

/**
 * Thread-safe singleton token refresher.
 * Coalesces concurrent refresh calls into one single HTTP request to avoid
 * backend Refresh Token Rotation (RTR) reuse conflicts.
 */
export const refreshAuthTokens = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const authData = localStorage.getItem("aibus_auth_tokens");
      if (!authData) {
        throw new Error("No session tokens found in storage");
      }

      let parsed;
      try {
        parsed = JSON.parse(authData);
      } catch {
        throw new Error("Corrupted auth tokens stored");
      }

      const refreshToken = parsed?.refreshToken;
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Use a raw axios call with withCredentials to avoid interceptor recursion
      let response;
      try {
        response = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          { refreshToken },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
            timeout: 15000,
          }
        );
      } catch (axiosErr) {
        if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
          clearAuthRefreshTimer();
          localStorage.removeItem("aibus_auth_tokens");
          localStorage.removeItem("loggedInUser");
          window.dispatchEvent(new Event("loginStatusChanged"));
        }
        throw axiosErr;
      }

      const newTokens = response.data?.data;
      if (newTokens?.accessToken) {
        const merged = {
          ...parsed,
          ...newTokens,
        };
        localStorage.setItem("aibus_auth_tokens", JSON.stringify(merged));
        scheduleProactiveRefresh(newTokens.accessToken);
        return merged;
      }

      throw new Error("Invalid token refresh payload returned by server");
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

let refreshTimerId = null;

export const clearAuthRefreshTimer = () => {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
};

/**
 * Proactively schedules token refresh 2 minutes before JWT access token expires
 * (15m token -> refreshes at minute 13), preventing 401 errors during active sessions.
 */
export const scheduleProactiveRefresh = (specificToken = null) => {
  if (typeof window === "undefined") return;

  clearAuthRefreshTimer();

  let token = specificToken;
  if (!token) {
    try {
      const authData = localStorage.getItem("aibus_auth_tokens");
      if (authData) {
        token = JSON.parse(authData)?.accessToken;
      }
    } catch {
      token = null;
    }
  }

  if (!token) return;

  const remainingMs = getAccessTokenRemainingMs(token);
  // Default to 13 minutes (780,000 ms) if expiration cannot be decoded
  const safeRemaining = remainingMs > 0 ? remainingMs : 13 * 60 * 1000;

  // Schedule refresh 2 minutes before expiry (or in 500ms if already near/past expiry)
  const delay = Math.max(safeRemaining - 2 * 60 * 1000, 500);

  refreshTimerId = setTimeout(async () => {
    try {
      const authData = localStorage.getItem("aibus_auth_tokens");
      if (authData) {
        await refreshAuthTokens();
      }
    } catch (err) {
      console.warn("[Auth] Proactive background token refresh failed:", err?.message || err);
    }
  }, delay);
};

let isKeepAliveInitialized = false;

/**
 * Initializes proactive refresh listeners:
 * - Listens for cross-tab storage changes
 * - Proactively refreshes when browser tab regains focus or visibility
 */
export const initAuthSessionKeepAlive = () => {
  if (typeof window === "undefined" || isKeepAliveInitialized) return;
  isKeepAliveInitialized = true;

  // Initialize schedule on startup if tokens exist
  scheduleProactiveRefresh();

  // Multi-tab synchronization
  window.addEventListener("storage", (event) => {
    if (event.key === "aibus_auth_tokens") {
      if (event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed?.accessToken) {
            scheduleProactiveRefresh(parsed.accessToken);
          }
        } catch {
          // Ignore
        }
      } else {
        clearAuthRefreshTimer();
      }
    }
  });

  // When tab wakes up or regains focus, check if token needs immediate refresh
  const checkTokenFreshnessOnFocus = async () => {
    try {
      const authData = localStorage.getItem("aibus_auth_tokens");
      if (!authData) return;
      const parsed = JSON.parse(authData);
      const token = parsed?.accessToken;
      if (!token) return;

      const remainingMs = getAccessTokenRemainingMs(token);
      // If token has less than 2 minutes left or is expired, refresh immediately
      if (remainingMs <= 2 * 60 * 1000) {
        await refreshAuthTokens();
      }
    } catch {
      // Non-fatal; 401 interceptor handles on demand
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkTokenFreshnessOnFocus();
    }
  });

  window.addEventListener("focus", checkTokenFreshnessOnFocus);
};

// Start session keep-alive automatically
initAuthSessionKeepAlive();

// Request Interceptor: Attach Auth Token & Idempotency Key
api.interceptors.request.use(
  (config) => {
    try {
      const authData = localStorage.getItem("aibus_auth_tokens");
      if (authData) {
        const { accessToken } = JSON.parse(authData);
        if (accessToken) {
          if (typeof config.headers?.set === "function") {
            config.headers.set("Authorization", `Bearer ${accessToken}`);
            config.headers.set("access-token", accessToken);
          } else {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${accessToken}`;
            config.headers["access-token"] = accessToken;
          }
        }
      }
    } catch {
      // Ignore token read error
    }

    if (config.method === "post" && !config.headers["Idempotency-Key"]) {
      const idemKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      if (typeof config.headers?.set === "function") {
        config.headers.set("Idempotency-Key", idemKey);
      } else {
        config.headers["Idempotency-Key"] = idemKey;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Mutex token refresh & standardized error extraction
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (Unauthorized / Token Expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const requestUrl = originalRequest.url || "";
      // If the refresh request itself fails with 401, don't loop
      if (requestUrl.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      // Check if we have an active session with tokens to refresh
      const authData = localStorage.getItem("aibus_auth_tokens");
      if (!authData) {
        // No session tokens stored (guest or logged out); do not attempt refresh
        return Promise.reject(error);
      }

      let parsedRefreshToken = null;
      try {
        parsedRefreshToken = JSON.parse(authData)?.refreshToken;
      } catch {
        parsedRefreshToken = null;
      }

      if (!parsedRefreshToken) {
        clearAuthRefreshTimer();
        localStorage.removeItem("aibus_auth_tokens");
        localStorage.removeItem("loggedInUser");
        return Promise.reject(error);
      }

      // If another refresh is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (typeof originalRequest.headers?.set === "function") {
              originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
              originalRequest.headers.set("access-token", newToken);
            } else if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              originalRequest.headers["access-token"] = newToken;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await refreshAuthTokens();
        const newAccessToken = tokens?.accessToken;
        if (!newAccessToken) {
          throw new Error("Token refresh did not yield an access token");
        }

        processQueue(null, newAccessToken);

        if (typeof originalRequest.headers?.set === "function") {
          originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
          originalRequest.headers.set("access-token", newAccessToken);
        } else if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers["access-token"] = newAccessToken;
        }

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        // Clear storage and notify logout if refresh token was rejected or corrupted
        clearAuthRefreshTimer();
        localStorage.removeItem("aibus_auth_tokens");
        localStorage.removeItem("loggedInUser");
        window.dispatchEvent(new Event("loginStatusChanged"));

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
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

    const enhancedError = new Error(message);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);

export default api;

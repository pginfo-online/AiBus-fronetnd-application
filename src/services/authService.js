import api from "./api";

const LOGIN_KEY = "loggedInUser";
const TOKEN_KEY = "aibus_auth_tokens";

export const authService = {
  getLoggedInUser: () => {
    try {
      const data = localStorage.getItem(LOGIN_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getTokens: () => {
    try {
      const data = localStorage.getItem(TOKEN_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    const tokens = authService.getTokens();
    return Boolean(tokens?.accessToken);
  },

  /**
   * Register a new user account with production backend schema
   * @param {Object} params
   * @param {string} params.firstName
   * @param {string} params.lastName
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} [params.phone]
   */
  register: async ({ firstName, lastName, email, password, phone }) => {
    const response = await api.post("/api/v1/auth/register", {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: email?.trim().toLowerCase(),
      password,
      ...(phone ? { phone: phone.trim() } : {}),
    });

    const data = response.data?.data;
    if (data?.tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(data.tokens));
    }
    if (data?.user) {
      localStorage.setItem(LOGIN_KEY, JSON.stringify(data.user));
      authService.notifyLoginStateChange();
    }
    return data;
  },

  /**
   * Log into account via email and password
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   */
  login: async ({ email, password }) => {
    const response = await api.post("/api/v1/auth/login", {
      email: email?.trim().toLowerCase(),
      password,
    });

    const data = response.data?.data;
    if (data?.tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(data.tokens));
    }
    if (data?.user) {
      localStorage.setItem(LOGIN_KEY, JSON.stringify(data.user));
      authService.notifyLoginStateChange();
    }
    return data?.user;
  },

  /**
   * Fetch authenticated user's profile from the backend
   */
  getProfile: async () => {
    try {
      const response = await api.get("/api/v1/users/profile");
      const user = response.data?.data;
      if (user) {
        localStorage.setItem(LOGIN_KEY, JSON.stringify(user));
        authService.notifyLoginStateChange();
      }
      return user;
    } catch (err) {
      // Return currently cached user if network/refresh fails
      return authService.getLoggedInUser();
    }
  },

  /**
   * Log out session both remotely and locally
   */
  logout: async () => {
    try {
      const tokens = authService.getTokens();
      if (tokens?.refreshToken) {
        await api.post("/api/v1/auth/logout", { refreshToken: tokens.refreshToken });
      } else {
        await api.post("/api/v1/auth/logout");
      }
    } catch {
      // Proceed with local clean-up even if remote token invalidation errors
    } finally {
      localStorage.removeItem(LOGIN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      authService.notifyLoginStateChange();
    }
  },

  notifyLoginStateChange: () => {
    window.dispatchEvent(new Event("loginStatusChanged"));
  },
};

export default authService;

import DOMPurify from "dompurify";
import { AuthFormData, AuthResponse, User } from "../types/auth-types";
import axios from "axios";

// Configure secure axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// XSS sanitization helper
const sanitizeInput = (data: unknown) =>
  JSON.parse(DOMPurify.sanitize(JSON.stringify(data)));

export const register = async (data: AuthFormData) => {
  const sanitizedData = sanitizeInput(data);
  return api.post<AuthResponse>("/auth/register", sanitizedData);
};

export const login = async (email: string, password: string) => {
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedPassword = sanitizeInput(password);

  const response = await api.post<AuthResponse>("/auth/login", {
    email: sanitizedEmail,
    password: sanitizedPassword,
  });

  if (response.data.token) {
    storeAuthData(response.data);
  }

  return response;
};

export const logout = () => {
  sessionStorage.removeItem("rht-user");
  // Clear token from axios defaults
  delete api.defaults.headers.common["Authorization"];
};

// Secure storage with sessionStorage
export const storeAuthData = (userData: AuthResponse) => {
  const storageData = {
    id: userData.user.id,
    email: userData.user.email,
    username: userData.user.username,
    image: userData.user.image,
    token: userData.token,
    refreshToken: userData.refreshToken,
  };

  sessionStorage.setItem("rht-user", JSON.stringify(storageData));

  // Set the token for future API calls
  api.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
};

// Get current user from session storage
export const getCurrentUser = () => {
  const userData = sessionStorage.getItem("rht-user");
  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);

    // Set the token for API calls if a valid user is found
    if (parsed.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${parsed.token}`;
    }

    return parsed;
  } catch (error) {
    console.error("Invalid user data", error);
    return null;
  }
};

// Function to fetch the current user from the API
export const fetchCurrentUser = async (): Promise<User> => {
  try {
    // Add token from session storage
    const user = getCurrentUser();
    if (user?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
      console.log("Set Authorization header for /me request");
    } else {
      console.warn("No token available for /me request");
    }

    console.log("Fetching current user from API");
    const response = await api.get<User>("/auth/me");
    console.log("Current user fetched successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching current user:", error.message);

    if (error.response?.status === 401) {
      console.log("401 Unauthorized, attempting token refresh");
      // Try to refresh the token
      const refreshSuccess = await refreshAuthToken();
      if (refreshSuccess) {
        console.log("Token refresh successful, retrying /me request");
        // Retry with the new token
        const response = await api.get<User>("/auth/me");
        return response.data;
      }
    }
    throw error;
  }
};
// Token refresh logic
export const refreshAuthToken = async () => {
  try {
    const user = getCurrentUser();
    if (!user?.refreshToken) throw new Error("No refresh token");

    const response = await api.post<{
      token: string;
      refreshToken: string;
    }>("/auth/refresh", {
      refreshToken: user.refreshToken,
    });

    // Store both new tokens
    storeAuthData({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        image: user.image,
      },
      token: response.data.token,
      refreshToken: response.data.refreshToken,
    });

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    logout();
    return false;
  }
};

// Set up response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If received 401 and we haven't tried refreshing yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh" // Prevent infinite loop
    ) {
      originalRequest._retry = true;

      try {
        const refreshSuccess = await refreshAuthToken();
        if (refreshSuccess) {
          // Update the token in the original request
          const user = getCurrentUser();
          if (user?.token) {
            originalRequest.headers["Authorization"] = `Bearer ${user.token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh error:", refreshError);
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Initialize auth state from session storage on module load
(function initAuthState() {
  const user = getCurrentUser();
  if (user?.token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
  }
})();

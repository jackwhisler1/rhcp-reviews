import DOMPurify from "dompurify";
import { AuthFormData, AuthResponse, User } from "../types/auth-types";
import axios from "axios";
import { fetchWrapper } from "./api";

// Configure secure axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});
export const setAuthHeader = (token: string) => {
  if (!token) return;

  // Set for api instance
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  // Also set for global axios
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

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

  return response;
};

export const logout = () => {
  console.log("Logging out and clearing auth data");
  sessionStorage.removeItem("rht-user");
  // Clear token from axios defaults
  delete api.defaults.headers.common["Authorization"];
};

// Secure storage with sessionStorage - IMPROVED VERSION
export const storeAuthData = (userData: AuthResponse) => {
  if (!userData.token) {
    console.error("Cannot store auth data: no token provided");
    return;
  }

  try {
    const storageData = {
      id: userData.user.id,
      email: userData.user.email,
      username: userData.user.username,
      avatarColor: userData.user.avatarColor,
      image: userData.user.image,
      token: userData.token,
      refreshToken: userData.refreshToken,
    };

    console.log(
      "Storing auth data with token:",
      userData.token.substring(0, 15) + "..."
    );
    sessionStorage.setItem("rht-user", JSON.stringify(storageData));

    // Set the token for future API calls
    api.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
    console.log("Set Authorization header for future API calls");
  } catch (error) {
    console.error("Error storing auth data:", error);
  }
};

// Get current user from session storage - IMPROVED VERSION
export const getCurrentUser = () => {
  try {
    const userData = sessionStorage.getItem("rht-user");
    if (!userData) {
      console.log("No user data found in session storage");
      return null;
    }

    try {
      const parsed = JSON.parse(userData);

      // Validate parsed user data
      if (!parsed.id || !parsed.token) {
        console.error("Invalid user data structure in storage:", parsed);
        return null;
      }

      // Set the token for API calls if a valid user is found
      if (parsed.token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${parsed.token}`;
        console.log(
          "Retrieved token from storage:",
          parsed.token.substring(0, 15) + "..."
        );
      }

      return parsed;
    } catch (error) {
      console.error("Invalid user data", error);
      sessionStorage.removeItem("rht-user"); // Clean up invalid data
      return null;
    }
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
};

export const updateUser = async (data: {
  username?: string;
  email?: string;
  password?: string;
  image?: string;
  avatarColor?: string;
}) => {
  const sanitizedData = sanitizeInput(data);
  const response = await api.patch("/auth/me", sanitizedData);
  const updatedUser = response.data;
  const current = getCurrentUser();
  if (current && updatedUser) {
    storeAuthData({
      user: {
        ...current,
        ...updatedUser,
      },
      token: current.token,
      refreshToken: current.refreshToken,
    });
  }

  return response.data;
};

// Function to check if the token is valid
export const checkStoredToken = () => {
  try {
    // Get the user data from session storage
    const userData = sessionStorage.getItem("rht-user");
    if (!userData) {
      console.warn("No user data in session storage");
      return false;
    }

    // Parse the user data
    const parsedData = JSON.parse(userData);

    // Check if token exists
    if (!parsedData.token) {
      console.warn("No token in stored user data");
      return false;
    }

    // Check token format (should be a JWT - three parts separated by dots)
    const tokenParts = parsedData.token.split(".");
    if (tokenParts.length !== 3) {
      console.warn("Token does not appear to be a valid JWT format");
      return false;
    }

    // Log token info for debugging
    console.log("Token exists and appears to be valid format");
    console.log(
      "Token starts with:",
      parsedData.token.substring(0, 15) + "..."
    );

    // Try to decode the JWT payload (middle part)
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const expiry = payload.exp ? new Date(payload.exp * 1000) : null;

      console.log("Token payload:", payload);
      if (expiry) {
        console.log("Token expires:", expiry);
        console.log("Token expired?", expiry < new Date());
      }
    } catch (e) {
      console.warn("Could not decode token payload");
    }

    return true;
  } catch (error) {
    console.error("Error checking stored token:", error);
    return false;
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
        avatarColor: user.avatarColor,
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

export const sendPasswordResetEmail = async (email: string) => {
  try {
    console.log(`Sending forgot password email to ${email}`);
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }), // include the email in the POST body
    };
    console.log(options);

    const response = await fetchWrapper(`/auth/forgot-password`, options);
    return response.data;
  } catch (error) {
    console.error(`Error with forgot password operation`, error);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    console.log(
      "Resetting password with token:",
      token.substring(0, 15) + "..."
    );
    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    };
    const response = await fetchWrapper(`/auth/reset-password`, options);
    return response;
  } catch (error) {
    console.error("Error with reset password operation", error);
    throw error;
  }
};

// Initialize auth state from session storage on module load
(function initAuthState() {
  const user = getCurrentUser();
  if (user?.token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    console.log("Set initial Authorization header from session storage");
  }
})();

export { api };

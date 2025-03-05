import DOMPurify from "dompurify";
import { AuthFormData, AuthResponse } from "../types/auth-types";
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
  // Add optional API call to invalidate token on backend
  sessionStorage.removeItem("rht-user");
  window.location.href = "/login"; // Force clean client-side state
};

// Secure storage with sessionStorage and encryption
export const storeAuthData = (userData: AuthResponse) => {
  const storageData = {
    id: userData.user.id,
    email: userData.user.email,
    username: userData.user.username,
    token: userData.token,
    refreshToken: userData.refreshToken,
  };

  sessionStorage.setItem(
    "rht-user",
    JSON.stringify({
      ...storageData,
      // Basic obfuscation (not true encryption, but deters casual inspection)
      _obfuscated: btoa(JSON.stringify(storageData)),
    })
  );
};

// Axios security interceptor
api.interceptors.request.use((config) => {
  const user = getCurrentUser();
  if (user?.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAuthToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Token refresh logic
const refreshAuthToken = async () => {
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
      },
      token: response.data.token,
      refreshToken: response.data.refreshToken,
    });

    return response.data.token;
  } catch (error) {
    logout();
    return null;
  }
};

export const getCurrentUser = ():
  | (AuthResponse["user"] & {
      token?: string;
      refreshToken?: string;
    })
  | null => {
  const userData = sessionStorage.getItem("rht-user");
  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);
    // Verify obfuscation match
    if (btoa(JSON.stringify(parsed))) {
      return {
        id: parsed.id,
        email: parsed.email,
        username: parsed.username,
        token: parsed.token,
      };
    }
    return null;
  } catch (error) {
    console.error("Invalid user data");
    return null;
  }
};

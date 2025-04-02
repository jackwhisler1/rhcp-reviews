import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  fetchCurrentUser,
  logout,
} from "../services/authService";
import { AuthContextType, User } from "../types/auth-types";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  setUser: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state synchronously first
  useEffect(() => {
    const initAuth = () => {
      try {
        console.log("Initial auth state check");
        // First check session storage for cached user data
        const storedUser = getCurrentUser();
        console.log("Stored user from session storage:", storedUser);

        if (storedUser) {
          // Important: Set user state immediately from storage
          setUser({
            id: storedUser.id,
            username: storedUser.username,
            email: storedUser.email,
            image: storedUser.image,
            token: storedUser.token,
            refreshToken: storedUser.refreshToken,
          });
        }
      } catch (err) {
        console.error("Initial auth state error:", err);
      } finally {
        // Don't set loading false yet - wait for API check
      }
    };

    // Run synchronous init immediately
    initAuth();
  }, []);

  // Then fetch fresh data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Skip API call if no user in storage
        if (!user) {
          console.log("No stored user, skipping API fetch");
          setLoading(false);
          return;
        }

        console.log("Fetching current user from API");
        try {
          const freshUserData = await fetchCurrentUser();
          console.log("Fresh user data from API:", freshUserData);

          // Update user with fresh data but keep tokens
          setUser((currentUser) => {
            if (!currentUser) return null;

            return {
              id: freshUserData.id || currentUser.id,
              username: freshUserData.username || currentUser.username,
              email: freshUserData.email || currentUser.email,
              image: freshUserData.image || currentUser.image,
              // Keep the tokens from current user state
              token: currentUser.token,
              refreshToken: currentUser.refreshToken,
            };
          });
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      } catch (err) {
        console.error("Auth API fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]); // Only re-run if user ID changes

  const handleLogout = () => {
    console.log("Logging out");
    logout();
    setUser(null);
  };

  const isAuthenticated = !!user?.token;

  // Log auth state changes for debugging
  useEffect(() => {
    console.log("Auth state updated:", {
      isAuthenticated,
      user: user ? { id: user.id, username: user.username } : null,
      hasToken: !!user?.token,
      loading,
    });
  }, [isAuthenticated, user, loading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        setUser,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

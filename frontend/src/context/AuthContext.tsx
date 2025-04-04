import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  fetchCurrentUser,
  logout,
  storeAuthData,
} from "../services/authService";
import { AuthContextType, User } from "../types/auth-types";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  setUser: () => {},
  logout: () => {},
  login: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state synchronously first
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("Auth initialization started");
        // First check session storage for cached user data
        const storedUser = getCurrentUser();
        console.log("Stored user from session storage:", storedUser);

        if (storedUser) {
          // Important: Keep the tokens when setting the user state
          setUser({
            id: storedUser.id,
            username: storedUser.username,
            email: storedUser.email,
            image: storedUser.image,
            token: storedUser.token,
            refreshToken: storedUser.refreshToken,
          });

          // Then try to fetch the latest user data from the server
          try {
            console.log("Fetching current user from API");
            const freshUserData: User = await fetchCurrentUser();
            console.log("Fresh user data from API:", freshUserData);

            // Fix: Explicitly type and access properties instead of using spread
            if (freshUserData && typeof freshUserData === "object") {
              setUser((currentUser) => ({
                id: freshUserData.id || storedUser.id,
                username: freshUserData.username || storedUser.username,
                email: freshUserData.email || storedUser.email,
                image: freshUserData.image || storedUser.image,
                // Keep the tokens from storage
                token: storedUser.token,
                refreshToken: storedUser.refreshToken,
              }));
            }
          } catch (error) {
            console.error("Error fetching current user:", error);
            // Keep using the stored user data
          }
        } else {
          console.log("No stored user found in session storage");
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

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

  const handleLogin = (userData: any) => {
    console.log("Auth Context: handleLogin called with:", {
      userId: userData.user?.id,
      username: userData.user?.username,
      hasToken: !!userData.token,
      hasRefreshToken: !!userData.refreshToken,
    });

    try {
      // Store auth data in storage
      console.log("Auth Context: Storing auth data");
      storeAuthData(userData);

      // Double check that data was stored
      const storedUser = getCurrentUser();
      console.log("Auth Context: Verified stored user data:", {
        userId: storedUser?.id,
        username: storedUser?.username,
        hasToken: !!storedUser?.token,
      });

      // Update state
      console.log("Auth Context: Setting user state");
      setUser({
        id: userData.user.id,
        username: userData.user.username,
        email: userData.user.email,
        image: userData.user.image,
        token: userData.token,
        refreshToken: userData.refreshToken,
      });

      console.log("Auth Context: User state should now be updated");
    } catch (error) {
      console.error("Auth Context: Error in handleLogin:", error);
    }
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
        login: handleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

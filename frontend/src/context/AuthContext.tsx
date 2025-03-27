import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  fetchCurrentUser,
  logout,
} from "../services/authService";

interface User {
  id: number;
  username: string;
  email: string;
  image?: string | null;
  token?: string;
  refreshToken?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
}

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

  const handleLogout = () => {
    console.log("Logging out");
    logout();
    setUser(null);
  };

  // Calculate authentication status
  const isAuthenticated = !!user && !loading;

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

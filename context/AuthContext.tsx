"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  logoutMessage: string | null;
  clearLogoutMessage: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Only handle actual browser/tab close, not refresh
    const handleUnload = (e: BeforeUnloadEvent) => {
      if (e.persisted) return; // Don't clear if it's just a refresh
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  useEffect(() => {
    const validateAndSetUser = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const userEmail = localStorage.getItem("userEmail");
      
      if (!token || !userId) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Keep current auth state while validating
      setIsAuthenticated(true);
      setUser({
        id: userId,
        email: userEmail || "",
      });

      try {
        // Validate token by making a request to the API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://tradalystbackend-chantabbai07ai.replit.app' || 'https://52c8265e-6e58-4fdf-ad64-fa60ff0fb5b8-00-3o6lyfavjj71.riker.replit.dev'}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userId,
            email: userEmail || "",
            ...userData
          });
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          // Only clear on unauthorized response
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          setUser(null);
          setIsAuthenticated(false);
        }
        // Don't clear auth state for other error status codes
      } catch (error) {
        // Don't clear auth state on network errors
      }
    };

    validateAndSetUser();
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch(`/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        // Ensure token is still stored
        localStorage.setItem("token", token);
      } else if (response.status === 401) {
        // Only remove token if it's actually invalid
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Don't remove token on network errors
      setIsAuthenticated(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://tradalystbackend-chantabbai07ai.replit.app' || 'https://52c8265e-6e58-4fdf-ad64-fa60ff0fb5b8-00-3o6lyfavjj71.riker.replit.dev'}/api/users/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Origin": window.location.origin
        },
        mode: "cors",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      if (data.token && data.userId) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userEmail", email);
        setUser({ id: data.userId, email });
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setUser(null);
    setIsAuthenticated(false);
    setLogoutMessage("You have been successfully logged out.");
    router.push("/");
  };

  const clearLogoutMessage = () => {
    setLogoutMessage(null);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Authentication token not found");
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`/api/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem("token");
          setUser(null);
          setIsAuthenticated(false);
          router.push("/auth/login");
          throw new Error("Your session has expired. Please log in again.");
        }

        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to change password");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch(`/api/users/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(email),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send reset email");
      }

      const responseText = await response.text();
      return responseText;
    } catch (error) {
      console.error("Request password reset error:", error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`/api/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      return await response.text();
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        logoutMessage,
        clearLogoutMessage,
        changePassword,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  logoutMessage: string | null;
  clearLogoutMessage: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const router = useRouter();

  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/validate-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  const fetchUserData = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('token', token);
      } else {
        handleAuthError();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  // Initialization effect
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        handleAuthError();
        setIsInitialized(true);
        return;
      }

      const isValid = await validateToken(token);
      if (isValid) {
        await fetchUserData(token);
      } else {
        handleAuthError();
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, [fetchUserData, validateToken, handleAuthError]);

  // Periodic token validation
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const validateInterval = setInterval(async () => {
      const isValid = await validateToken(token);
      if (!isValid) {
        handleAuthError();
      }
    }, TOKEN_VALIDATION_INTERVAL);

    return () => clearInterval(validateInterval);
  }, [isAuthenticated, validateToken, handleAuthError]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      if (data.token && data.userId) {
        const isValid = await validateToken(data.token);
        if (!isValid) {
          throw new Error('Invalid token received');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        setUser({ id: data.userId, email });
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    setIsAuthenticated(false);
    setLogoutMessage("You have been successfully logged out.");
    router.push('/');
  }, [router]);

  const clearLogoutMessage = () => {
    setLogoutMessage(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          router.push('/auth/login');
          throw new Error('Your session has expired. Please log in again.');
        }
        
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch(`/api/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to send reset email');
      }

      return await response.text();
    } catch (error) {
      console.error('Request password reset error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      return await response.text();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      isInitialized,
      isLoading, 
      login, 
      logout, 
      logoutMessage, 
      clearLogoutMessage,
      changePassword,
      requestPasswordReset,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

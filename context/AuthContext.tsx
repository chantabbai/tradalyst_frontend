
"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const decodeToken = (token: string): { valid: boolean; user: User | null; exp?: number } => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    return {
      valid: true,
      user: {
        id: payload.sub || payload.userId,
        email: payload.email
      },
      exp: payload.exp
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return { valid: false, user: null };
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const validateToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const { valid, user: decodedUser, exp } = decodeToken(token);
    if (!valid || !decodedUser) return false;

    // Check token expiration
    if (exp && exp * 1000 < Date.now()) return false;

    return { token, user: decodedUser };
  };

  useEffect(() => {
    const initializeAuth = () => {
      const validation = validateToken();
      if (validation && typeof validation !== 'boolean') {
        setUser(validation.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenInterval = setInterval(() => {
      const validation = validateToken();
      if (!validation || typeof validation === 'boolean') {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTokenInterval);
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`/api/users/login`, {
        method: 'POST',
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        const validation = validateToken();
        if (validation && typeof validation !== 'boolean') {
          setUser(validation.user);
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    setIsAuthenticated(false);
    setLogoutMessage("You have been successfully logged out.");
    router.push('/');
  };

  const clearLogoutMessage = () => {
    setLogoutMessage(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const validation = validateToken();
    if (!validation || typeof validation === 'boolean') {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validation.token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
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
        body: JSON.stringify({ email }),
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

  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
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

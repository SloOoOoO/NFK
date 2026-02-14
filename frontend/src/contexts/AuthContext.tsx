import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string, refreshToken?: string) => void;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface JWTPayload {
  exp: number;
  [key: string]: unknown;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is valid and not expired
  const isTokenValid = (token: string): boolean => {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const now = Date.now() / 1000;
      return decoded.exp > now;
    } catch {
      return false;
    }
  };

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');

      if (token && userStr && isTokenValid(token)) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Token expired or invalid - clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      // Error parsing user data - clear everything
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (userData: User, token: string, refreshToken?: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  const loginWithTokens = async (accessToken: string, refreshToken: string) => {
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Fetch user data
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // Log OAuth login failure
      if (error instanceof Error) {
        console.error('[AuthContext] Failed to fetch user data after OAuth login:', error.message);
      } else {
        console.error('[AuthContext] Failed to fetch user data after OAuth login');
      }
      // Clear tokens if we can't get user data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      authAPI.logout(refreshToken).catch(() => {
        // Ignore logout errors
      });
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data;
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        loginWithTokens,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

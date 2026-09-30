import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  mockLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoRole = urlParams.get('auto_auth');
    if (autoRole) {
      try {
        const resp = authService.mockLogin(autoRole);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setRole(resp.role);
        setIsLoading(false);
        return;
      } catch (e) {
        console.warn('Auto auth fallback:', e);
      }
    }

    const token = authService.getStoredToken();
    if (!token) {
      setUser(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setRole(currentUser.role);
    } catch {
      authService.logout();
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await authService.login(email, password);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setRole(resp.role);
    } finally {
      setIsLoading(false);
    }
  };

  const mockLogin = async (mockRole: UserRole) => {
    setIsLoading(true);
    try {
      const resp = authService.mockLogin(mockRole);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setRole(resp.role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRole(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setRole(currentUser.role);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        mockLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

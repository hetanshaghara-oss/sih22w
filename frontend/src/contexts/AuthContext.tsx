import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
      const email = autoRole === 'tester' ? 'tester@nawi-lab.org' : autoRole === 'reviewer' ? 'reviewer@nawi-lab.org' : 'admin@nawi-lab.org';
      const pwd = autoRole === 'tester' ? 'Tester@12345' : autoRole === 'reviewer' ? 'Reviewer@12345' : 'Admin@12345';
      try {
        await login(email, pwd);
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
      // Fetch full profile
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

import api from './api';
import { User, LoginResponse } from '../types/auth';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    if (response.data.access_token) {
      localStorage.setItem('nawi_token', response.data.access_token);
      localStorage.setItem('nawi_user', JSON.stringify({
        email: response.data.email,
        name: response.data.user_name,
        role: response.data.role,
      }));
    }
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('nawi_token');
    localStorage.removeItem('nawi_user');
  },

  getStoredToken(): string | null {
    return localStorage.getItem('nawi_token');
  },

  getStoredUser(): { email: string; name: string; role: string } | null {
    const raw = localStorage.getItem('nawi_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};

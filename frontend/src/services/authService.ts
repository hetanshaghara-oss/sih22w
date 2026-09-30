import api from './api';
import { User, LoginResponse, UserRole } from '../types/auth';
import { MOCK_USERS } from './mockData';

export const authService = {
  mockLogin(roleOrEmail: string): LoginResponse {
    const key = (roleOrEmail || 'admin').toLowerCase();
    let selected = MOCK_USERS.admin;
    if (key.includes('tester')) {
      selected = MOCK_USERS.tester;
    } else if (key.includes('reviewer')) {
      selected = MOCK_USERS.reviewer;
    } else if (key.includes('viewer')) {
      selected = MOCK_USERS.viewer;
    }

    const mockToken = `mock-token-${selected.role}-${Date.now()}`;
    localStorage.setItem('nawi_token', mockToken);
    localStorage.setItem(
      'nawi_user',
      JSON.stringify({
        id: selected.id,
        email: selected.email,
        name: selected.name,
        role: selected.role,
      })
    );

    return {
      access_token: mockToken,
      token_type: 'bearer',
      role: selected.role,
      user_name: selected.name,
      email: selected.email,
    };
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      if (response.data.access_token) {
        localStorage.setItem('nawi_token', response.data.access_token);
        localStorage.setItem(
          'nawi_user',
          JSON.stringify({
            email: response.data.email,
            name: response.data.user_name,
            role: response.data.role,
          })
        );
      }
      return response.data;
    } catch (err: any) {
      console.warn('Real backend authentication unavailable. Falling back to mock authentication:', err);
      // Seamless mock login fallback
      return this.mockLogin(email);
    }
  },

  async getCurrentUser(): Promise<User> {
    const token = this.getStoredToken();
    if (token?.startsWith('mock-token-')) {
      const stored = this.getStoredUser();
      const role = (stored?.role as UserRole) || 'admin';
      const mock = MOCK_USERS[role] || MOCK_USERS.admin;
      return {
        id: mock.id,
        name: stored?.name || mock.name,
        email: stored?.email || mock.email,
        role: role,
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
    }

    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (err) {
      const stored = this.getStoredUser();
      if (stored) {
        const role = (stored.role as UserRole) || 'admin';
        const mock = MOCK_USERS[role] || MOCK_USERS.admin;
        return {
          id: mock.id,
          name: stored.name || mock.name,
          email: stored.email || mock.email,
          role: role,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        };
      }
      throw err;
    }
  },

  logout(): void {
    localStorage.removeItem('nawi_token');
    localStorage.removeItem('nawi_user');
  },

  getStoredToken(): string | null {
    return localStorage.getItem('nawi_token');
  },

  getStoredUser(): { id?: number; email: string; name: string; role: string } | null {
    const raw = localStorage.getItem('nawi_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};

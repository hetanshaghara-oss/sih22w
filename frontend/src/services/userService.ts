import api from './api';
import { User, UserRole } from '../types/auth';

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserCreateParams {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
}

export interface UserUpdateParams {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
}

export const userService = {
  async getUsers(params?: {
    search?: string;
    role?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedUsers> {
    const res = await api.get<PaginatedUsers>('/users', { params });
    return res.data;
  },

  async getUser(id: number): Promise<User> {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },

  async createUser(data: UserCreateParams): Promise<User> {
    const res = await api.post<User>('/users', data);
    return res.data;
  },

  async updateUser(id: number, data: UserUpdateParams): Promise<User> {
    const res = await api.put<User>(`/users/${id}`, data);
    return res.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

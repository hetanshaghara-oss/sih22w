export type UserRole = 'admin' | 'tester' | 'reviewer' | 'viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_name: string;
  email: string;
}

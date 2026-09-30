import api from './api';
import { DashboardData } from '../types/dashboard';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },

  async getEngineStatus(): Promise<{ status: string; message: string; version: string }> {
    const response = await api.get('/dashboard/compliance-engine-status');
    return response.data;
  },
};

import api from './api';
import { User } from '../types/auth';

export interface AuditLogEntry {
  id: number;
  user_id?: number | null;
  action: string;
  entity_type: string;
  entity_id: string;
  reference_number?: string | null;
  ip_address?: string | null;
  details_json?: string | null;
  created_at: string;
  user?: User | null;
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SystemInfo {
  app_name: string;
  version: string;
  environment: string;
  database_type: string;
  database_size_bytes: number;
  total_users: number;
  total_instruments: number;
  total_tests: number;
  total_reports: number;
  total_audit_logs: number;
  uptime_seconds: number;
}

export const auditService = {
  async getAuditLogs(params?: {
    search?: string;
    action?: string;
    entity_type?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedAuditLogs> {
    const res = await api.get<PaginatedAuditLogs>('/audit-logs', { params });
    return res.data;
  },

  async getActions(): Promise<string[]> {
    const res = await api.get<string[]>('/audit-logs/actions/list');
    return res.data;
  },

  async getSystemInfo(): Promise<SystemInfo> {
    const res = await api.get<SystemInfo>('/system/info');
    return res.data;
  },

  async downloadDatabaseBackup(): Promise<void> {
    const res = await api.get('/system/backup', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `nawi_backup_${now}.db`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

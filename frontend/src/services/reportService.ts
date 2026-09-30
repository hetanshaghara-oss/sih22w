import api from './api';
import { ReportSummary, ReportDetail, PaginatedReports, ReportSnapshot } from '../types/report';

export const reportService = {
  getReports: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    verdict?: string;
  }): Promise<PaginatedReports> => {
    const response = await api.get<PaginatedReports>('/reports', { params });
    return response.data;
  },

  getReportById: async (id: number): Promise<ReportDetail> => {
    const response = await api.get<ReportDetail>(`/reports/${id}`);
    return response.data;
  },

  generateReport: async (payload: {
    test_id: number;
    summary_remarks?: string;
  }): Promise<ReportDetail> => {
    const response = await api.post<ReportDetail>('/reports', payload);
    return response.data;
  },

  getReportPdfBlob: async (id: number): Promise<Blob> => {
    const response = await api.get(`/reports/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  previewReportByTest: async (testId: number): Promise<{
    data: ReportSnapshot;
    checksum: string;
    overall_verdict: string;
  }> => {
    const response = await api.get(`/reports/preview-by-test/${testId}`);
    return response.data;
  },

  previewReportPdfBlob: async (testId: number): Promise<Blob> => {
    const response = await api.get(`/reports/preview-pdf-by-test/${testId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadBlob: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

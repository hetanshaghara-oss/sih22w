import api from './api';
import { Instrument, InstrumentCreateInput, PaginatedInstruments } from '../types/instrument';

export interface InstrumentQueryParams {
  search?: string;
  status?: string;
  instrument_type?: string;
  accuracy_class?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const instrumentService = {
  async getInstruments(params: InstrumentQueryParams = {}): Promise<PaginatedInstruments> {
    const response = await api.get<PaginatedInstruments>('/instruments', { params });
    return response.data;
  },

  async getInstrumentById(id: number): Promise<Instrument> {
    const response = await api.get<Instrument>(`/instruments/${id}`);
    return response.data;
  },

  async createInstrument(data: InstrumentCreateInput): Promise<Instrument> {
    const response = await api.post<Instrument>('/instruments', data);
    return response.data;
  },

  async updateInstrument(id: number, data: Partial<InstrumentCreateInput>): Promise<Instrument> {
    const response = await api.put<Instrument>(`/instruments/${id}`, data);
    return response.data;
  },

  async deleteInstrument(id: number): Promise<void> {
    await api.delete(`/instruments/${id}`);
  },
};

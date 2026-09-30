export type InstrumentStatus = 'Active' | 'Inactive' | 'Under Testing';

export type AccuracyClass = 'Class I' | 'Class II' | 'Class III' | 'Class IIII';

export interface Instrument {
  id: number;
  instrument_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  instrument_type: string;
  instrument_class: string;
  maximum_capacity: number;
  minimum_capacity: number;
  verification_scale_interval: number;
  accuracy_class: string;
  country_of_manufacture: string;
  status: InstrumentStatus;
  created_at: string;
  updated_at: string;
}

export interface InstrumentCreateInput {
  instrument_id: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  instrument_type: string;
  instrument_class: string;
  maximum_capacity: number;
  minimum_capacity: number;
  verification_scale_interval: number;
  accuracy_class: string;
  country_of_manufacture: string;
  status: InstrumentStatus;
}

export interface PaginatedInstruments {
  items: Instrument[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

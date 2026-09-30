import { User } from './auth';
import { Test } from './testing';

export interface ReportSummary {
  id: number;
  report_number: string;
  test_id: number;
  certificate_title: string;
  overall_verdict: 'PASS' | 'FAIL' | 'REVIEW';
  issued_by_id: number;
  authorized_by_id?: number;
  checksum_hash: string;
  created_at: string;
  issued_by?: User;
  authorized_by?: User;
  test?: Test;
}


export interface ComplianceProcedureSummary {
  definition_code: string;
  definition_name: string;
  clause_reference: string;
  verdict: 'PASS' | 'FAIL' | 'REVIEW' | 'INCOMPLETE';
  permissible_limit_e?: number;
  permissible_limit_absolute?: number;
  max_deviation_found?: number;
  max_deviation_relative_e?: number;
  total_points_evaluated: number;
  failed_points_count: number;
  failure_reason?: string;
  point_by_point_compliance?: Array<{
    point_index: number;
    load: number;
    error: number;
    mpe: number;
    deviation_from_limit: number;
    status: string;
    note?: string;
  }>;
}

export interface ReportSnapshot {
  metadata: {
    system_name: string;
    standard: string;
    generated_at: string;
    test_id_str: string;
    test_date: string;
    status: string;
    tester_name: string;
    reviewer_name: string;
    laboratory_name: string;
    laboratory_location: string;
    remarks: string;
  };
  instrument: {
    instrument_id: string;
    manufacturer: string;
    model: string;
    serial_number: string;
    accuracy_class: string;
    max_capacity: number;
    min_capacity: number;
    scale_interval_d: number;
    verification_scale_interval_e: number;
    tare_capacity: number;
    n_intervals: number;
    unit: string;
  };
  environmental_conditions: {
    temperature_celsius?: number;
    relative_humidity_percent?: number;
    atmospheric_pressure_kpa?: number;
    start_time?: string;
    end_time?: string;
    reference_standards?: string;
    remarks?: string;
  };
  compliance_summary: {
    test_id: string;
    accuracy_class: string;
    verification_scale_interval_e: number;
    overall_status: 'PASS' | 'FAIL' | 'REVIEW';
    total_procedures: number;
    passed_procedures: number;
    failed_procedures: number;
    procedures: ComplianceProcedureSummary[];
  };
  procedures: Array<{
    definition_code: string;
    definition_name: string;
    clause_reference: string;
    verdict: string;
    explanation: string;
    calculated_values: any;
    observations: Array<any>;
  }>;
  checksum_hash?: string;
}

export interface ReportDetail extends ReportSummary {
  report_data_json: string;
  summary_remarks?: string;
  file_path?: string;
}

export interface PaginatedReports {
  items: ReportSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

import { Instrument } from './instrument';
import { User } from './auth';

export type TestStatus = 'Draft' | 'In Progress' | 'Under Review' | 'Completed' | 'Failed';

export type OverallVerdict = 'PENDING' | 'PASS' | 'FAIL' | 'REVIEW' | 'INCOMPLETE';

export interface EnvironmentalCondition {
  id?: number;
  test_id?: number;
  temperature_celsius?: number;
  relative_humidity_percent?: number;
  atmospheric_pressure_kpa?: number;
  test_location?: string;
  start_time?: string;
  end_time?: string;
  reference_standards?: string;
  remarks?: string;
}

export interface TestDefinition {
  id: number;
  code: string;
  name: string;
  clause_reference: string;
  description?: string;
  required_observations_count: number;
  category: string;
  is_active: boolean;
}

export interface Observation {
  id: number;
  instance_id: number;
  sequence_order: number;
  load_point: number;
  indicated_value: number;
  extra_load_added: number;
  zero_indicated: number;
  tare_applied: number;
  position_label?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ObservationInput {
  sequence_order?: number;
  load_point: number;
  indicated_value: number;
  extra_load_added?: number;
  zero_indicated?: number;
  tare_applied?: number;
  position_label?: string;
  notes?: string;
}

export interface TestResult {
  id: number;
  instance_id: number;
  rule_id?: number;
  rule_version: string;
  applicable_rule_code?: string;
  calculated_values_json: string;
  allowable_limit_description: string;
  verdict: 'PASS' | 'FAIL' | 'REVIEW' | 'INCOMPLETE';
  explanation: string;
  evaluated_at: string;
}

export interface TestInstance {
  id: number;
  test_id: number;
  definition_id: number;
  status: 'Pending' | 'In Progress' | 'Evaluated';
  verdict: 'PENDING' | 'PASS' | 'FAIL' | 'REVIEW' | 'INCOMPLETE';
  is_outdated: boolean;
  evaluation_summary?: string;
  evaluated_at?: string;
  created_at: string;
  updated_at: string;
  definition?: TestDefinition;
  observations: Observation[];
  results: TestResult[];
}

export interface Test {
  id: number;
  test_id: string;
  instrument_id: number;
  tester_id: number;
  reviewer_id?: number;
  laboratory_name: string;
  test_location?: string;
  remarks?: string;
  reviewer_comments?: string;
  status: TestStatus;
  overall_verdict: OverallVerdict;
  started_at?: string;
  completed_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;

  instrument?: Instrument;
  tester?: User;
  reviewer?: User;
  environmental_condition?: EnvironmentalCondition;
  test_instances: TestInstance[];
}

export interface PaginatedTests {
  items: Test[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

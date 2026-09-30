import api from './api';
import {
  Test,
  TestDefinition,
  TestInstance,
  Observation,
  ObservationInput,
  TestResult,
  EnvironmentalCondition,
  PaginatedTests,
} from '../types/testing';

export interface TestQueryParams {
  search?: string;
  status?: string;
  verdict?: string;
  instrument_id?: number;
  manufacturer?: string;
  serial_number?: string;
  tester_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export const testingService = {
  // Tests CRUD
  async createTest(data: {
    instrument_id: number;
    laboratory_name: string;
    test_location?: string;
    remarks?: string;
  }): Promise<Test> {
    const response = await api.post<Test>('/tests', data);
    return response.data;
  },

  async getTests(params: TestQueryParams = {}): Promise<PaginatedTests> {
    const response = await api.get<PaginatedTests>('/tests', { params });
    return response.data;
  },

  async getTestHistory(params: TestQueryParams = {}): Promise<PaginatedTests> {
    const response = await api.get<PaginatedTests>('/tests/history', { params });
    return response.data;
  },

  async getTestById(id: number): Promise<Test> {
    const response = await api.get<Test>(`/tests/${id}`);
    return response.data;
  },

  async updateTest(id: number, data: Partial<Test>): Promise<Test> {
    const response = await api.put<Test>(`/tests/${id}`, data);
    return response.data;
  },

  async deleteTest(id: number): Promise<void> {
    await api.delete(`/tests/${id}`);
  },

  // Environmental Conditions
  async saveEnvironmentalConditions(
    testId: number,
    data: EnvironmentalCondition
  ): Promise<EnvironmentalCondition> {
    const response = await api.post<EnvironmentalCondition>(
      `/tests/${testId}/environment`,
      data
    );
    return response.data;
  },

  async getEnvironmentalConditions(
    testId: number
  ): Promise<EnvironmentalCondition | null> {
    const response = await api.get<EnvironmentalCondition | null>(
      `/tests/${testId}/environment`
    );
    return response.data;
  },

  // Test Definitions
  async getTestDefinitions(): Promise<TestDefinition[]> {
    const response = await api.get<TestDefinition[]>('/test-definitions');
    return response.data;
  },

  // Test Instances (Procedures)
  async attachTestInstance(
    testId: number,
    definitionId: number
  ): Promise<TestInstance> {
    const response = await api.post<TestInstance>('/test-instances', {
      test_id: testId,
      definition_id: definitionId,
    });
    return response.data;
  },

  async deleteTestInstance(instanceId: number): Promise<void> {
    await api.delete(`/test-instances/${instanceId}`);
  },

  // Raw Observations
  async addObservation(
    instanceId: number,
    data: ObservationInput
  ): Promise<Observation> {
    const response = await api.post<Observation>(
      `/test-instances/${instanceId}/observations`,
      data
    );
    return response.data;
  },

  async updateObservation(
    instanceId: number,
    obsId: number,
    data: Partial<ObservationInput>
  ): Promise<Observation> {
    const response = await api.put<Observation>(
      `/test-instances/${instanceId}/observations/${obsId}`,
      data
    );
    return response.data;
  },

  async deleteObservation(instanceId: number, obsId: number): Promise<void> {
    await api.delete(`/test-instances/${instanceId}/observations/${obsId}`);
  },

  // Compliance Evaluation
  async evaluateInstance(instanceId: number): Promise<TestResult> {
    const response = await api.post<TestResult>(
      `/test-instances/${instanceId}/evaluate`
    );
    return response.data;
  },

  async getInstanceResults(instanceId: number): Promise<TestResult | null> {
    const response = await api.get<TestResult | null>(
      `/test-instances/${instanceId}/results`
    );
    return response.data;
  },

  // Reviewer Workflow
  async submitForReview(testId: number): Promise<Test> {
    const response = await api.post<Test>(`/tests/${testId}/submit-review`);
    return response.data;
  },

  async reviewTest(
    testId: number,
    action: 'approve' | 'reject',
    comments?: string
  ): Promise<Test> {
    const response = await api.post<Test>(`/tests/${testId}/review`, {
      action,
      comments,
    });
    return response.data;
  },
};

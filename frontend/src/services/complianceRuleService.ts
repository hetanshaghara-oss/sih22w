import api from './api';

export interface ComplianceRule {
  id: number;
  rule_code: string;
  test_code: string;
  accuracy_class: string;
  version: string;
  parameter_name: string;
  formula_type: string;
  criteria_json: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ComplianceRuleCreateInput {
  rule_code: string;
  test_code: string;
  accuracy_class: string;
  version?: string;
  parameter_name: string;
  formula_type: string;
  criteria_json: string;
  description?: string;
  is_active?: boolean;
}

export const complianceRuleService = {
  getRules: async (): Promise<ComplianceRule[]> => {
    const response = await api.get<ComplianceRule[]>('/compliance-rules');
    return response.data;
  },

  getRuleById: async (id: number): Promise<ComplianceRule> => {
    const response = await api.get<ComplianceRule>(`/compliance-rules/${id}`);
    return response.data;
  },

  createRule: async (data: ComplianceRuleCreateInput): Promise<ComplianceRule> => {
    const response = await api.post<ComplianceRule>('/compliance-rules', data);
    return response.data;
  },

  updateRule: async (id: number, data: Partial<ComplianceRuleCreateInput>): Promise<ComplianceRule> => {
    const response = await api.put<ComplianceRule>(`/compliance-rules/${id}`, data);
    return response.data;
  },

  deleteRule: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/compliance-rules/${id}`);
    return response.data;
  },
};

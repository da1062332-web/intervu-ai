import { apiClient } from '@/services/api/client';
import { VariableType, RuleType } from '@intervu/shared/enums';

export interface TemplateVariable {
  id: string;
  templateId: string;
  variableName: string;
  variableType: VariableType;
  required: boolean;
  defaultValue?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateRule {
  id: string;
  templateId: string;
  ruleType: RuleType;
  ruleConfig: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  topicId?: string;
  difficultyId?: string;
  isBaseTemplate: boolean;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTemplates {
  items: Template[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateVariablePayload {
  variableName: string;
  variableType: VariableType;
  required?: boolean;
  defaultValue?: string | null;
}

export interface UpdateVariablePayload {
  variableName?: string;
  variableType?: VariableType;
  required?: boolean;
  defaultValue?: string | null;
}

export interface CreateRulePayload {
  ruleType: RuleType;
  ruleConfig: Record<string, unknown>;
}

export interface UpdateRulePayload {
  ruleType?: RuleType;
  ruleConfig?: Record<string, unknown>;
}

export interface ValidationResponse {
  valid: boolean;
  errors: string[];
}

export const templatesApi = {
  getTemplates: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString();
    return apiClient.request<PaginatedTemplates>(`/templates${query ? `?${query}` : ''}`);
  },

  getVariables: (templateId: string) => {
    return apiClient.request<TemplateVariable[]>(`/templates/${templateId}/variables`);
  },

  createVariable: (templateId: string, payload: CreateVariablePayload) => {
    return apiClient.request<TemplateVariable>(`/templates/${templateId}/variables`, {
      method: 'POST',
      body: payload,
    });
  },

  updateVariable: (id: string, payload: UpdateVariablePayload) => {
    return apiClient.request<TemplateVariable>(`/variables/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deleteVariable: (id: string) => {
    return apiClient.request<{ id: string }>(`/variables/${id}`, {
      method: 'DELETE',
    });
  },

  getRules: (templateId: string) => {
    return apiClient.request<TemplateRule[]>(`/templates/${templateId}/rules`);
  },

  createRule: (templateId: string, payload: CreateRulePayload) => {
    return apiClient.request<TemplateRule>(`/templates/${templateId}/rules`, {
      method: 'POST',
      body: payload,
    });
  },

  updateRule: (id: string, payload: UpdateRulePayload) => {
    return apiClient.request<TemplateRule>(`/rules/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deleteRule: (id: string) => {
    return apiClient.request<{ id: string }>(`/rules/${id}`, {
      method: 'DELETE',
    });
  },

  validateTemplate: (templateId: string, values: Record<string, unknown>) => {
    return apiClient.request<ValidationResponse>(`/templates/${templateId}/validate`, {
      method: 'POST',
      body: { values },
    });
  },
};

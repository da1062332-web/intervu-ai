import { apiClient } from '@/services/api/client';

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  entitySchema: Record<string, unknown>;
  relationSchema: Record<string, unknown>;
  rules: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScenarioPayload {
  name: string;
  description?: string;
  entitySchema: Record<string, unknown>;
  relationSchema: Record<string, unknown>;
  rules?: Record<string, unknown>;
}

export interface UpdateScenarioPayload {
  name?: string;
  description?: string;
  entitySchema?: Record<string, unknown>;
  relationSchema?: Record<string, unknown>;
  rules?: Record<string, unknown>;
}

export const scenariosApi = {
  getAll: (): Promise<Scenario[]> =>
    apiClient.request<Scenario[]>('/scenarios', { method: 'GET' }),

  getById: (id: string): Promise<Scenario> =>
    apiClient.request<Scenario>(`/scenarios/${id}`, { method: 'GET' }),

  create: (payload: CreateScenarioPayload): Promise<Scenario> =>
    apiClient.request<Scenario>('/scenarios', { method: 'POST', body: payload }),

  update: (id: string, payload: UpdateScenarioPayload): Promise<Scenario> =>
    apiClient.request<Scenario>(`/scenarios/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: string): Promise<void> =>
    apiClient.request<void>(`/scenarios/${id}`, { method: 'DELETE' }),
};

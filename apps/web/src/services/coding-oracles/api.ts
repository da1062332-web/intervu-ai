import { apiClient } from '../api/client';

export interface CodingOracleItem {
  id: string;
  key: string;
  name: string;
  category: string;
  description?: string;
  supportedDifficulties: string[];
  parameterSchema: Record<string, any>;
  metadata?: Record<string, any>;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  isProviderAvailable: boolean;
  patternCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodingOracleListResponse {
  items: CodingOracleItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCodingOraclePayload {
  key: string;
  name: string;
  category?: string;
  description?: string;
  supportedDifficulties?: string[];
  parameterSchema?: Record<string, any>;
  isActive?: boolean;
  version?: number;
}

export interface UpdateCodingOraclePayload {
  name?: string;
  category?: string;
  description?: string;
  supportedDifficulties?: string[];
  parameterSchema?: Record<string, any>;
  isActive?: boolean;
  version?: number;
}

export interface TestCodingOraclePayload {
  parameterSchema?: Record<string, any>;
  difficulty?: string;
  seed?: number;
}

export const getCodingOracles = async (
  category?: string,
  isActive?: boolean,
  search?: string,
  page = 1,
  limit = 500,
): Promise<CodingOracleListResponse> => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category) query.append('category', category);
  if (isActive !== undefined) query.append('isActive', String(isActive));
  if (search) query.append('search', search);

  return apiClient.request<CodingOracleListResponse>(`/coding-oracles?${query.toString()}`, {
    method: 'GET',
  });
};

export const getCodingOracle = async (idOrKey: string): Promise<CodingOracleItem> => {
  return apiClient.request<CodingOracleItem>(`/coding-oracles/${idOrKey}`, { method: 'GET' });
};

export const createCodingOracle = async (payload: CreateCodingOraclePayload): Promise<CodingOracleItem> => {
  return apiClient.request<CodingOracleItem>('/coding-oracles', {
    method: 'POST',
    body: payload,
  });
};

export const updateCodingOracle = async (idOrKey: string, payload: UpdateCodingOraclePayload): Promise<CodingOracleItem> => {
  return apiClient.request<CodingOracleItem>(`/coding-oracles/${idOrKey}`, {
    method: 'PUT',
    body: payload,
  });
};

export const toggleCodingOracleStatus = async (idOrKey: string): Promise<CodingOracleItem> => {
  return apiClient.request<CodingOracleItem>(`/coding-oracles/${idOrKey}/toggle`, {
    method: 'PATCH',
  });
};

export const syncCodingOracles = async (): Promise<{ syncedCount: number; totalCount: number }> => {
  return apiClient.request<{ syncedCount: number; totalCount: number }>('/coding-oracles/sync', {
    method: 'POST',
  });
};

export const testCodingOracle = async (idOrKey: string, payload: TestCodingOraclePayload): Promise<any> => {
  return apiClient.request<any>(`/coding-oracles/${idOrKey}/test`, {
    method: 'POST',
    body: payload,
  });
};

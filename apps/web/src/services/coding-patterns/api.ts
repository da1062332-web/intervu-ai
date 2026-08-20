import { apiClient } from '../api/client';

export interface OracleMetadata {
  key: string;
  name: string;
  category: string;
  description: string;
  supportedDifficulties: string[];
  parameterSchema?: Record<string, any>;
}

export interface CodingPattern {
  id: string;
  patternKey: string;
  title: string;
  slug: string;
  description?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  oracleKey: string;
  statementSpecification?: Record<string, any>;
  parameterSchema?: Record<string, any>;
  constraintSchema?: Record<string, any>;
  aiConfiguration?: Record<string, any>;
  starterCode?: Record<string, any>;
  metadata?: Record<string, any>;
  testCases?: Array<{
    input: any;
    expectedOutput: any;
    isPublic?: boolean;
    isStress?: boolean;
    isBoundary?: boolean;
    explanation?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CodingPatternListResponse {
  items: CodingPattern[];
  total: number;
  page: number;
  limit: number;
}

export interface PreviewCodingPatternPayload {
  patternId?: string;
  oracleKey?: string;
  parameterSchema?: Record<string, any>;
  constraintSchema?: Record<string, any>;
  seed?: number;
  difficulty?: string;
  generateStatement?: boolean;
  forceRegenerate?: boolean;
}

export interface PatternPreviewResponse {
  parameters: Record<string, any>;
  generatedInput: Record<string, any>;
  expectedOutput: Record<string, any>;
  publicTests: Array<{ input: any; expectedOutput: any; explanation?: string }>;
  hiddenTests: Array<{ input: any; expectedOutput: any }>;
  stressTests: Array<{ input: any; expectedOutput: any }>;
  boundaryTests: Array<{ input: any; expectedOutput: any }>;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  aiPreview?: {
    narrative: string;
    codeSkeletons: Record<string, string>;
  };
}

export const getOracles = async (): Promise<OracleMetadata[]> => {
  return apiClient.request<OracleMetadata[]>('/coding-patterns/oracles', { method: 'GET' });
};

export const getCodingPatterns = async (page = 1, limit = 20, search?: string): Promise<CodingPatternListResponse> => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.append('search', search);
  return apiClient.request<CodingPatternListResponse>(`/coding-patterns?${query.toString()}`, { method: 'GET' });
};

export const getCodingPattern = async (id: string): Promise<CodingPattern> => {
  return apiClient.request<CodingPattern>(`/coding-patterns/${id}`, { method: 'GET' });
};

export const createCodingPattern = async (payload: Partial<CodingPattern>): Promise<CodingPattern> => {
  return apiClient.request<CodingPattern>('/coding-patterns', {
    method: 'POST',
    body: payload,
  });
};

export const updateCodingPattern = async (id: string, payload: Partial<CodingPattern>): Promise<CodingPattern> => {
  return apiClient.request<CodingPattern>(`/coding-patterns/${id}`, {
    method: 'PUT',
    body: payload,
  });
};

export const deleteCodingPattern = async (id: string): Promise<CodingPattern> => {
  return apiClient.request<CodingPattern>(`/coding-patterns/${id}`, { method: 'DELETE' });
};

export const previewCodingPattern = async (payload: PreviewCodingPatternPayload): Promise<PatternPreviewResponse> => {
  return apiClient.request<PatternPreviewResponse>('/coding-patterns/preview', {
    method: 'POST',
    body: payload,
  });
};

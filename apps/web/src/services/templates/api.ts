import { apiClient } from '../api/client';
export interface TemplateListResponse {
  data?: any;
  items: any[];
  [key: string]: any;
}
export interface TemplateResponse {
  data?: any;
  [key: string]: any;
}
export interface SolutionTemplateResponse {
  data?: any;
  [key: string]: any;
}
export interface CreateSolutionTemplateRequest {
  [key: string]: any;
}
export interface UpdateSolutionTemplateRequest {
  [key: string]: any;
}
export interface TemplatePreviewResponse {
  data?: any;
  [key: string]: any;
}
export interface GenerateTemplatePreviewRequest {
  [key: string]: any;
}
export const getTemplates = async (
  page = 1,
  limit = 10,
  conceptKey?: string,
): Promise<TemplateListResponse> => {
  const url = conceptKey
    ? `/templates?conceptKey=${conceptKey}&page=${page}&limit=${limit}`
    : `/templates?page=${page}&limit=${limit}`;
  const data = await apiClient.request<any>(url, { method: 'GET' });
  return data;
};

export const createTemplate = async (payload: any): Promise<TemplateResponse> => {
  const data = await apiClient.request<any>('/templates', {
    method: 'POST',
    body: payload,
  });
  return data;
};

export const getTemplate = async (id: string): Promise<TemplateResponse> => {
  const data = await apiClient.request<any>(`/templates/${id}`, { method: 'GET' });
  return data;
};

export const getSolutionTemplate = async (
  templateId: string,
): Promise<SolutionTemplateResponse> => {
  const data = await apiClient.request<any>(`/templates/${templateId}/solution`, { method: 'GET' });
  return data;
};

export const createSolutionTemplate = async (
  templateId: string,
  payload: CreateSolutionTemplateRequest,
): Promise<SolutionTemplateResponse> => {
  const data = await apiClient.request<any>(`/templates/${templateId}/solution`, {
    method: 'POST',
    body: payload,
  });
  return data;
};

export const updateSolutionTemplate = async (
  templateId: string,
  payload: UpdateSolutionTemplateRequest,
): Promise<SolutionTemplateResponse> => {
  const data = await apiClient.request<any>(`/templates/${templateId}/solution`, {
    method: 'PATCH',
    body: payload,
  });
  return data;
};

export const generatePreview = async (
  templateId: string,
  payload: GenerateTemplatePreviewRequest,
): Promise<TemplatePreviewResponse> => {
  const data = await apiClient.request<any>(`/templates/${templateId}/preview`, {
    method: 'POST',
    body: payload,
  });
  return data;
};

export const getLatestPreview = async (templateId: string): Promise<TemplatePreviewResponse> => {
  const data = await apiClient.request<any>(`/templates/${templateId}/preview`, { method: 'GET' });
  return data;
};

export const getVariables = async (templateId: string): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/variables`, { method: 'GET' });
};

export const getRules = async (templateId: string): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/rules`, { method: 'GET' });
};

export const updateTemplate = async (templateId: string, payload: any): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}`, {
    method: 'PATCH',
    body: payload,
  });
};

export const updateQuestionTemplate = async (templateId: string, payload: any): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/question`, {
    method: 'PATCH',
    body: payload,
  });
};

export const updateOptionsTemplate = async (templateId: string, payload: any): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/options`, {
    method: 'PATCH',
    body: payload,
  });
};

export const createVariable = async (templateId: string, payload: any): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/variables`, {
    method: 'POST',
    body: payload,
  });
};

export const updateVariable = async (variableId: string, payload: any): Promise<any> => {
  return await apiClient.request<any>(`/variables/${variableId}`, {
    method: 'PATCH',
    body: payload,
  });
};

export const deleteVariable = async (variableId: string): Promise<any> => {
  return await apiClient.request<any>(`/variables/${variableId}`, { method: 'DELETE' });
};

export const createRule = async (templateId: string, payload: any): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/rules`, {
    method: 'POST',
    body: payload,
  });
};

export const updateRule = async (ruleId: string, payload: any): Promise<any> => {
  return await apiClient.request<any>(`/rules/${ruleId}`, {
    method: 'PATCH',
    body: payload,
  });
};

export const deleteRule = async (ruleId: string): Promise<any> => {
  return await apiClient.request<any>(`/rules/${ruleId}`, { method: 'DELETE' });
};

export const saveTemplateDatasetConfig = async (templateId: string, payload: any): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/dataset`, {
    method: 'PATCH',
    body: payload,
  });
};

export const getTemplateDatasetPreview = async (templateId: string): Promise<any> => {
  return await apiClient.request<any>(`/question-generation/dataset-preview`, {
    method: 'POST',
    body: { templateId },
  });
};

export const deleteTemplate = async (id: string): Promise<any> => {
  return await apiClient.request<any>(`/templates/${id}`, { method: 'DELETE' });
};

// AI Strategy Drafting APIs
export const draftStrategy = async (templateId: string, prompt: string): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/ai/strategy/draft`, {
    method: 'POST',
    body: { prompt },
  });
};

export const previewStrategy = async (templateId: string, draft: any): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/ai/strategy/preview`, {
    method: 'POST',
    body: { draft },
  });
};

export const applyStrategy = async (templateId: string, draft: any): Promise<any> => {
  return await apiClient.request<any>(`/templates/${templateId}/ai/strategy/apply`, {
    method: 'POST',
    body: { draft },
  });
};

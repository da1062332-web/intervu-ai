import { apiClient } from '@/services/api/client';
import type {
  CreateSolutionTemplateRequest,
  UpdateSolutionTemplateRequest,
  GenerateTemplatePreviewRequest,
  SolutionTemplateResponse,
  TemplatePreviewResponse,
} from '@intervu/shared';

export const getTemplates = async (page = 1, limit = 10): Promise<any> => {
  return await apiClient.request<any>(`/templates?page=${page}&limit=${limit}`, { method: 'GET' });
};

export const createTemplate = async (payload: any): Promise<any> => {
  return await apiClient.request<any>(`/templates`, {
    method: 'POST',
    body: payload,
  });
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

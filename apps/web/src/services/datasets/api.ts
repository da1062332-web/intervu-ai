import { apiClient } from '@/services/api/client';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  type: string;
  topicId?: string;
  conceptId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

export interface DatasetItem {
  id: string;
  datasetId: string;
  questionText?: string;
  content: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  difficulty: string;
  topic: string;
  topicId?: string;
  conceptId?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetWithItems extends Dataset {
  items: DatasetItem[];
}

export interface CreateDatasetPayload {
  name: string;
  description?: string;
  type: string;
  topicId?: string;
  conceptId?: string;
}

export interface UpdateDatasetPayload {
  name?: string;
  description?: string;
  type?: string;
  topicId?: string;
  conceptId?: string;
}

export interface CreateDatasetItemPayload {
  questionText?: string;
  content?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  difficulty: string;
  topic?: string;
  topicId?: string;
  conceptId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export const datasetsApi = {
  getAll: (): Promise<Dataset[]> =>
    apiClient.request<Dataset[]>('/datasets', { method: 'GET' }),

  getById: (id: string): Promise<DatasetWithItems> =>
    apiClient.request<DatasetWithItems>(`/datasets/${id}`, { method: 'GET' }),

  create: (payload: CreateDatasetPayload): Promise<Dataset> =>
    apiClient.request<Dataset>('/datasets', { method: 'POST', body: payload }),

  update: (id: string, payload: UpdateDatasetPayload): Promise<Dataset> =>
    apiClient.request<Dataset>(`/datasets/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: string): Promise<void> =>
    apiClient.request<void>(`/datasets/${id}`, { method: 'DELETE' }),

  addItem: (datasetId: string, payload: CreateDatasetItemPayload): Promise<DatasetItem> =>
    apiClient.request<DatasetItem>(`/datasets/${datasetId}/items`, {
      method: 'POST',
      body: payload,
    }),

  bulkAddItems: (datasetId: string, payload: CreateDatasetItemPayload[]): Promise<DatasetItem[]> =>
    apiClient.request<DatasetItem[]>(`/datasets/${datasetId}/items/bulk`, {
      method: 'POST',
      body: payload,
    }),

  deleteItem: (itemId: string): Promise<void> =>
    apiClient.request<void>(`/datasets/items/${itemId}`, { method: 'DELETE' }),

  updateItem: (itemId: string, payload: Partial<CreateDatasetItemPayload>): Promise<DatasetItem> =>
    apiClient.request<DatasetItem>(`/datasets/items/${itemId}`, {
      method: 'PATCH',
      body: payload,
    }),

  getDatasetSchema: (datasetId: string): Promise<any> =>
    apiClient.request<any>(`/datasets/${datasetId}/schema`, { method: 'GET' }),
};

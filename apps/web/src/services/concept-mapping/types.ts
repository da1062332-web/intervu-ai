export interface ConceptMapping {
  id: string;
  topicId: string;
  name: string;
  code: string;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;

  // Legacy compatibility fields
  conceptName: string;
  conceptCode: string;
  isActive: boolean;
}

export interface CreateConceptPayload {
  name?: string;
  code?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';

  // Legacy compatibility fields
  conceptName?: string;
  conceptCode?: string;
}

export interface UpdateConceptPayload {
  name?: string;
  code?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';

  // Legacy compatibility fields
  conceptName?: string;
  conceptCode?: string;
  isActive?: boolean;
}

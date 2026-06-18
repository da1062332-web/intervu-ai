export interface ConceptMapping {
  id: string;
  topicId: string;
  conceptName: string;
  conceptCode: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateConceptPayload {
  conceptName: string;
  conceptCode: string;
  description?: string;
}

export interface UpdateConceptPayload {
  conceptName?: string;
  conceptCode?: string;
  description?: string;
  isActive?: boolean;
}

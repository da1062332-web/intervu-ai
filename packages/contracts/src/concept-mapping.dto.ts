export interface CreateConcept {
  name: string;
  code: string;
  description?: string | null;
  status?: string;
}

export interface UpdateConcept {
  name?: string;
  code?: string;
  description?: string | null;
  status?: string;
}

export interface ConceptDto {
  id: string;
  topicId: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Backwards compatibility aliases
export interface CreateConceptMapping {
  conceptName: string;
  conceptCode: string;
  description?: string | null;
}

export interface UpdateConceptMapping {
  conceptName?: string;
  conceptCode?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ConceptMappingDto {
  id: string;
  topicId: string;
  conceptName: string;
  conceptCode: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

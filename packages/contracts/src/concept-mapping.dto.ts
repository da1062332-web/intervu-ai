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

export interface ConceptMappingDto extends CreateConceptMapping {
  id: string;
  topicId: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

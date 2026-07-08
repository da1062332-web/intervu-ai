export * from '../question-generation/types';

export interface QuestionFilters {
  search?: string;
  topicId?: string;
  conceptId?: string;
  templateId?: string;
  status?: string;
  difficulty?: string;
}

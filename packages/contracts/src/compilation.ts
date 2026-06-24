export interface GenerationRequest {
  requestId: string;
  blueprintId: string;
  sectionId: string;
  topicId: string;
  conceptId: string;
  difficulty: string;
  templateId: string;
  quantity: number;
}

export interface GenerationBatch {
  batchId: string;
  blueprintId: string;
  requests: GenerationRequest[];
}

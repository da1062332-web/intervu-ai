export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: "EXACT_MATCH" | "SEMANTIC_MATCH" | "RECENTLY_USED";
  confidenceScore?: number;
  matchedQuestionId?: string;
}

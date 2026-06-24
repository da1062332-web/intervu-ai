export const SEMANTIC_SIMILARITY_PROVIDER = "SEMANTIC_SIMILARITY_PROVIDER";

export interface SemanticSimilarityProvider {
  calculateSimilarity(textA: string, textB: string): Promise<number>;
}

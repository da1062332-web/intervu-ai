import { Injectable } from "@nestjs/common";
import { SemanticSimilarityProvider } from "./semantic-similarity.provider";

@Injectable()
export class MockSemanticSimilarityProvider implements SemanticSimilarityProvider {
  async calculateSimilarity(textA: string, textB: string): Promise<number> {
    const tokenize = (text: string) =>
      new Set(text.toLowerCase().split(/\W+/).filter(Boolean));
    const setA = tokenize(textA);
    const setB = tokenize(textB);

    if (setA.size === 0 && setB.size === 0) return 1.0;

    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    return intersection / union;
  }
}

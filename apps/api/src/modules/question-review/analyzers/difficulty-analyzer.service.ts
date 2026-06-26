import { Injectable } from "@nestjs/common";

interface DifficultyInput {
  requestedDifficulty: string;
  generatedQuestion: {
    questionText: string;
    answer: string;
    explanation: string;
    options?: any;
  };
}

export interface DifficultyAnalysis {
  expected: string;
  actual: string;
  confidence: number;
}

@Injectable()
export class DifficultyAnalyzerService {
  async analyze(input: DifficultyInput): Promise<DifficultyAnalysis> {
    const expected = (input.requestedDifficulty || "MEDIUM").toUpperCase();
    const text = (input.generatedQuestion.questionText || "").toLowerCase();
    const explanation = (input.generatedQuestion.explanation || "").toLowerCase();

    // Heuristics for actual difficulty estimation
    let actual = "MEDIUM";

    const hardKeywords = [
      "polymorphism", "asynchronous", "recursion", "multithreading", "concurrent",
      "algorithm", "complexity", "time complexity", "space complexity", "binary search tree",
      "dynamic programming", "differentiate", "integral", "matrix", "vectors", "probability density",
      "eigenvalue", "eigenvector", "combinatorics", "combinatorial", "graph theory"
    ];

    const easyKeywords = [
      "what is", "define", "name the", "simple", "basic", "who wrote", "capital of",
      "formula of", "easy", "addition", "subtraction"
    ];

    let hardHits = 0;
    let easyHits = 0;

    for (const kw of hardKeywords) {
      if (text.includes(kw) || explanation.includes(kw)) {
        hardHits++;
      }
    }

    for (const kw of easyKeywords) {
      if (text.includes(kw) || explanation.includes(kw)) {
        easyHits++;
      }
    }

    const totalLength = text.length + explanation.length;

    if (totalLength > 300 || hardHits >= 2) {
      actual = "HARD";
    } else if (totalLength < 120 && easyHits >= 1 && hardHits === 0) {
      actual = "EASY";
    } else {
      actual = "MEDIUM";
    }

    // Determine confidence: if expected aligns with actual, confidence is higher
    let confidence = 0.85;
    if (actual !== expected) {
      // lower confidence if there is a mismatch
      confidence = 0.65;
    }

    return {
      expected,
      actual,
      confidence,
    };
  }
}

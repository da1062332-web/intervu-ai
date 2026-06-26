import { Injectable } from "@nestjs/common";

interface TopicInput {
  requestedTopic: string; // The expected topic name
  questionText: string;
  explanation: string;
}

export interface TopicAnalysisResult {
  requested: string;
  actual: string;
  match: boolean;
  confidence: number;
}

@Injectable()
export class TopicAnalyzerService {
  async analyze(input: TopicInput): Promise<TopicAnalysisResult> {
    const requested = (input.requestedTopic || "").trim();
    const requestedLower = requested.toLowerCase();
    const text = (input.questionText || "").toLowerCase();
    const explanation = (input.explanation || "").toLowerCase();

    // Map keywords to specific topics
    const topicKeywords: Record<string, string[]> = {
      Percentages: [
        "percent",
        "percentage",
        "%",
        "ratio",
        "proportion",
        "fraction",
      ],
      Probability: [
        "probabilit",
        "chance",
        "dice",
        "die",
        "coin",
        "card",
        "red ball",
        "urn",
        "marble",
        "permutation",
        "combination",
      ],
      "Logical Reasoning": [
        "logical",
        "pattern",
        "sequence",
        "next number",
        "series",
        "deduce",
        "syllogism",
        "blood relation",
        "direction sense",
      ],
      "Verbal Ability": [
        "sentence",
        "grammar",
        "synonym",
        "antonym",
        "preposition",
        "comprehension",
        "passage",
        "analogies",
      ],
      Coding: [
        "function",
        "code",
        "array",
        "complexity",
        "big o",
        "class",
        "object",
        "database",
        "sql",
        "java",
        "python",
        "javascript",
        "pointer",
        "compile",
      ],
    };

    let actual = requested; // default to requested if no other topic matches strongly
    let bestMatchScore = 0;

    for (const [topicName, keywords] of Object.entries(topicKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword) || explanation.includes(keyword)) {
          score++;
        }
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        actual = topicName;
      }
    }

    // Special exact mismatch overrides:
    // If the prompt requested Percentages but the content is clearly Probability (and best match is Probability), match is false!
    let match = true;
    if (
      requestedLower === "percentages" &&
      actual.toLowerCase() === "probability"
    ) {
      match = false;
    } else if (
      requestedLower === "probability" &&
      actual.toLowerCase() === "percentages"
    ) {
      match = false;
    } else if (requestedLower !== actual.toLowerCase()) {
      // General check: if they don't match, let's see if there's keyword overlap
      const reqKeywords = topicKeywords[requested] || [];
      const hasReqKeyword = reqKeywords.some(
        (kw) => text.includes(kw) || explanation.includes(kw),
      );

      // If the question contains absolutely no keywords for the requested topic, but contains keywords for another, fail the match
      if (
        !hasReqKeyword &&
        bestMatchScore >= 2 &&
        actual.toLowerCase() !== requestedLower
      ) {
        match = false;
      }
    }

    // Confidence score calculation
    let confidence = 0.9;
    if (!match) {
      confidence = 0.4;
    } else if (bestMatchScore > 0) {
      confidence = Math.min(0.95, 0.7 + bestMatchScore * 0.05);
    }

    return {
      requested,
      actual,
      match,
      confidence,
    };
  }
}

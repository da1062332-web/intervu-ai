import { Injectable } from "@nestjs/common";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

export interface TopicValidationResult {
  match: boolean;
  confidence: number;
}

@Injectable()
export class TopicAlignmentService {
  async validate(
    generated: GeneratedQuestionDto,
    requestedTopic: string,
  ): Promise<TopicValidationResult> {
    const genTopic = (generated.topic || "").trim().toLowerCase();
    const reqTopic = (requestedTopic || "").trim().toLowerCase();

    if (
      genTopic === reqTopic ||
      genTopic.includes(reqTopic) ||
      reqTopic.includes(genTopic)
    ) {
      return { match: true, confidence: 1.0 };
    }

    // Keyword matching fallback for extra robustness
    const keywords: Record<string, string[]> = {
      percentage: ["percent", "ratio", "proportion", "%"],
      probability: ["probabilit", "chance", "dice", "coin", "card"],
      coding: ["function", "code", "array", "complexity", "time complexity"],
      verbal: ["sentence", "grammar", "synonym", "antonym", "comprehension"],
    };

    const targetKeywords = keywords[reqTopic] || [];
    const questionText = (generated.question || "").toLowerCase();
    let hits = 0;

    for (const kw of targetKeywords) {
      if (questionText.includes(kw)) {
        hits++;
      }
    }

    const confidence =
      targetKeywords.length > 0 ? hits / targetKeywords.length : 0;
    const match = confidence >= 0.5;

    return {
      match,
      confidence,
    };
  }
}

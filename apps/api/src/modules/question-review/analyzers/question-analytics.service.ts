import { Injectable } from "@nestjs/common";

interface AnalyticsInput {
  questionText: string;
  answer: string;
  explanation: string;
  options: string[];
  topicName: string;
}

export interface QuestionAnalytics {
  readability: number;
  complexity: number;
  coverage: number;
}

@Injectable()
export class QuestionAnalyticsService {
  async analyze(input: AnalyticsInput): Promise<QuestionAnalytics> {
    const text = input.questionText || "";
    const answer = input.answer || "";
    const explanation = input.explanation || "";
    const options = input.options || [];
    const topic = input.topicName || "";

    // 1. Readability Score (0-100)
    // Simple heuristic: readability = 100 - (average word length * 10)
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalChars = words.reduce((sum, w) => sum + w.length, 0);
    const avgWordLength = words.length > 0 ? totalChars / words.length : 5;
    let readability = 100 - (avgWordLength * 8);
    readability = Math.max(10, Math.min(100, Math.round(readability)));

    // 2. Complexity Score (0-100)
    // Based on length of text, answer complexity, and options count
    const baseLengthScore = Math.min(40, text.length * 0.1);
    const answerComplexity = Math.min(30, answer.length * 0.5);
    const explanationComplexity = Math.min(20, explanation.length * 0.05);
    const optionComplexity = Math.min(10, options.length * 2.5);
    const complexity = Math.max(0, Math.min(100, Math.round(baseLengthScore + answerComplexity + explanationComplexity + optionComplexity)));

    // 3. Topic Coverage Score (0-100)
    // Based on word overlap of topic name, keywords, and question content
    const topicKeywords: Record<string, string[]> = {
      "Percentages": ["percent", "percentage", "%", "ratio", "proportion", "fraction"],
      "Probability": ["probabilit", "chance", "dice", "die", "coin", "card", "red ball", "urn", "marble", "permutation", "combination"],
      "Logical Reasoning": ["logical", "pattern", "sequence", "next number", "series", "deduce", "syllogism", "blood relation"],
      "Verbal Ability": ["sentence", "grammar", "synonym", "antonym", "preposition", "comprehension", "passage"],
      "Coding": ["function", "code", "array", "complexity", "big o", "class", "object", "database", "sql", "java", "python", "javascript"]
    };

    const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const contentLower = (text + " " + explanation).toLowerCase();

    let coverage = 85; // default baseline
    if (topicWords.length > 0) {
      const hasTopicWord = topicWords.some(w => 
        contentLower.includes(w) || 
        contentLower.includes(w.replace(/s$/, ""))
      );
      const keywords = topicKeywords[topic] || [];
      const hasKeyword = keywords.some(kw => contentLower.includes(kw));

      if (hasTopicWord || hasKeyword) {
        coverage = 95;
      } else {
        coverage = 50;
      }
    }

    return {
      readability,
      complexity,
      coverage,
    };
  }
}

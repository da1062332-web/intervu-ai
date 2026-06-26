import { Injectable } from "@nestjs/common";

interface EnrichmentInput {
  questionText: string;
  answer: string;
  explanation: string;
  difficulty: string;
  difficultyConfidence: number;
  topicName: string;
}

export interface EnrichedMetadata {
  keywords: string[];
  estimatedTime: number; // in seconds
  difficultyConfidence: number;
  tags: string[];
  subtopicTags: string[];
}

@Injectable()
export class QuestionEnrichmentService {
  async enrich(input: EnrichmentInput): Promise<EnrichedMetadata> {
    const diff = (input.difficulty || "MEDIUM").toUpperCase();
    const text = input.questionText || "";
    
    // 1. Calculate estimated solving time in seconds
    let estimatedTime = 90;
    if (diff === "EASY") {
      estimatedTime = 60;
    } else if (diff === "HARD") {
      estimatedTime = 120;
    }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 30) {
      estimatedTime += 15; // add buffer for reading
    }

    // 2. Topic tags
    const tags = [input.topicName];

    // 3. Keywords extraction (simple stopword filter)
    const stopwords = new Set([
      "what", "is", "the", "a", "an", "and", "or", "but", "if", "then", "else", "which", "who", "whom", "whose", "of", "to", "in", "on", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "from", "up", "down", "in", "out", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now"
    ]);

    const keywords = Array.from(new Set(
      words
        .map(w => w.replace(/[^a-zA-Z]/g, "").toLowerCase())
        .filter(w => w.length > 3 && !stopwords.has(w))
    )).slice(0, 5); // limit to top 5 keywords

    // 4. Subtopic tags mapping
    const subtopicMap: Record<string, string[]> = {
      "Percentages": ["Arithmetic", "Math", "Ratios"],
      "Probability": ["Statistics", "Combinatorics", "Math"],
      "Logical Reasoning": ["Aptitude", "Deduction", "Logic"],
      "Verbal Ability": ["English", "Grammar", "Vocabulary"],
      "Coding": ["Programming", "Computer Science", "Software"]
    };

    const subtopicTags = subtopicMap[input.topicName] || ["General"];

    return {
      keywords,
      estimatedTime,
      difficultyConfidence: input.difficultyConfidence,
      tags,
      subtopicTags,
    };
  }
}

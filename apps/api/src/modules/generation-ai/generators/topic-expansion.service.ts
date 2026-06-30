import { Injectable, Inject } from "@nestjs/common";
import { LLMAdapter } from "../adapters/llm-adapter.interface";

@Injectable()
export class TopicExpansionService {
  constructor(
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
  ) {}

  async expandTopic(topic: string): Promise<string[]> {
    const prompt = `You are a curriculum expert. Generate a flat list of 5 subtopics/concepts that belong to the core topic: "${topic}".
Return JSON array of strings only, like: ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5"].
Do not include any explanation, markdown or introductory text. Output must be raw JSON parsable.`;

    try {
      const response = await this.llmAdapter.generate(prompt);
      let cleaned = response.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(?:json)?/gi, "")
          .replace(/```$/gi, "")
          .trim();
      }
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => String(item).trim());
      }
    } catch (e) {
      console.warn("Topic expansion LLM parsing failed, using fallback subtopics", e);
    }

    // Fallbacks
    if (topic.toLowerCase().includes("percent")) {
      return [
        "Basic Percentages",
        "Profit Loss",
        "Discounts",
        "Successive Percentage",
        "Percentage Change",
      ];
    }

    return [
      `Basic ${topic}`,
      `Advanced ${topic}`,
      `Applications of ${topic}`,
      `${topic} Problem Solving`,
      `${topic} Theory`,
    ];
  }
}

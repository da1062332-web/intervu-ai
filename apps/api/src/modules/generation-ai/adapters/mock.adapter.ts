import { Injectable } from "@nestjs/common";
import { LLMAdapter } from "./llm-adapter.interface";

@Injectable()
export class MockAdapter implements LLMAdapter {
  private lastPrompt: string = "";

  getLastPrompt(): string {
    return this.lastPrompt;
  }

  async generate(prompt: string): Promise<string> {
    this.lastPrompt = prompt;

    // Detect topic and difficulty from prompt to return a matching mock question
    let topic = "General";
    const topicMatch = prompt.match(/- Concept Area:\s*([^\r\n]+)/i);
    if (topicMatch) {
      topic = topicMatch[1].trim();
    } else {
      if (prompt.toLowerCase().includes("percentage")) {
        topic = "Percentages";
      } else if (prompt.toLowerCase().includes("probability")) {
        topic = "Probability";
      } else if (prompt.toLowerCase().includes("logical")) {
        topic = "Logical Reasoning";
      } else if (prompt.toLowerCase().includes("verbal")) {
        topic = "Verbal Ability";
      } else if (prompt.toLowerCase().includes("coding")) {
        topic = "Coding";
      }
    }

    let difficulty = "Medium";
    const diffMatch = prompt.match(/- Difficulty Level:\s*([^\r\n]+)/i);
    if (diffMatch) {
      difficulty = diffMatch[1].trim();
    } else {
      if (prompt.toLowerCase().includes("easy")) {
        difficulty = "Easy";
      } else if (prompt.toLowerCase().includes("hard")) {
        difficulty = "Hard";
      }
    }

    return JSON.stringify({
      question: `Mock question about ${topic} at ${difficulty} level? (At least 15 chars)`,
      options: ["Mock Answer", "Incorrect Option B", "Incorrect Option C", "Incorrect Option D"],
      correctAnswer: "Mock Answer",
      answer: "Mock Answer",
      explanation: `Concept\nMock Concept about ${topic}\n\nFormula / Reasoning\nMock Reasoning\n\nStep-by-Step Solution\n1. Analyze the topic ${topic}\n2. Compute result at difficulty ${difficulty}\n\nFinal Answer\nMock Answer`,
      difficulty,
      topic,
      metadata: {
        topic
      }
    });
  }
}

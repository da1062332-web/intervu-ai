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

    let difficulty = "Medium";
    if (prompt.toLowerCase().includes("easy")) {
      difficulty = "Easy";
    } else if (prompt.toLowerCase().includes("hard")) {
      difficulty = "Hard";
    }

    return JSON.stringify({
      question: `Mock question about ${topic} at ${difficulty} level?`,
      answer: "Mock Answer",
      explanation: `Mock Explanation: why ${topic} fits.`,
      difficulty,
      topic,
    });
  }
}

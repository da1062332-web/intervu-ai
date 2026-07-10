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

    const rand = Math.floor(Math.random() * 1000000);
    const words = [
      "alpha",
      "beta",
      "gamma",
      "delta",
      "epsilon",
      "zeta",
      "eta",
      "theta",
      "iota",
      "kappa",
      "lambda",
      "mu",
      "nu",
      "xi",
      "omicron",
      "pi",
      "rho",
      "sigma",
      "tau",
      "upsilon",
      "phi",
      "chi",
      "psi",
      "omega",
    ];
    const w1 = words[rand % words.length];
    const w2 = words[Math.floor(rand / 100) % words.length];
    const w3 = words[Math.floor(rand / 10000) % words.length];

    return JSON.stringify({
      question: `Mock question about ${topic} at ${difficulty} level referencing ${w1} value, ${w2} factor, and ${w3} constraint? (At least 15 chars) #${rand}`,
      options: [
        `Mock Answer #${rand}`,
        `Incorrect Option B #${rand}`,
        `Incorrect Option C #${rand}`,
        `Incorrect Option D #${rand}`,
      ],
      correctAnswer: `Mock Answer #${rand}`,
      answer: `Mock Answer #${rand}`,
      explanation: `Concept\nMock Concept about ${topic}\n\nFormula / Reasoning\nMock Reasoning\n\nStep-by-Step Solution\n1. Analyze the topic ${topic} with ${w1}\n2. Compute result at difficulty ${difficulty} with ${w2} and ${w3}\n\nFinal Answer\nMock Answer #${rand}`,
      difficulty,
      topic,
      metadata: {
        topic,
        randomVal: rand,
      },
    });
  }
}

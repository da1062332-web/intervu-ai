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

    if (prompt.includes("expert AI assessment evaluator")) {
      return JSON.stringify({
        summary: "This is an AI generated summary of the candidate's performance, highlighting key areas of excellence and opportunities for growth.",
        practiceHours: 15,
        strengths: [
          { title: "Strong Conceptual Foundation", detail: "Demonstrated excellent understanding of core concepts with high accuracy." },
          { title: "Fast Problem Solving", detail: "Maintained a strong pace throughout the assessment without sacrificing correctness." }
        ],
        weaknesses: [
          { title: "Advanced Topics", detail: "Struggled with high-difficulty questions in specific technical areas." },
          { title: "Time Management", detail: "Spent too much time on a few complex questions, affecting overall pacing." }
        ],
        recommendations: [
          { priority: "HIGH", title: "Targeted Drills", action: "Practice advanced difficulty questions in weak areas daily." },
          { priority: "MEDIUM", title: "Mock Tests", action: "Take timed mock tests to improve pacing and time management." }
        ]
      });
    }

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

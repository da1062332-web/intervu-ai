import { InMemoryRecommendationEngine } from "../../recommendation/recommendation-engine";
import {
  determinePriority,
  removeDuplicates,
} from "../../recommendation/recommendation-rules";
import {
  RecommendationDto,
  SkillScore,
} from "../../recommendation/recommendation.types";

describe("Recommendation Intelligence Engine Tests", () => {
  let engine: InMemoryRecommendationEngine;

  beforeEach(() => {
    engine = new InMemoryRecommendationEngine();
  });

  describe("REC-001: Score < 40 resolves to Critical", () => {
    it("should assign critical priority for score 20 and map React critical topics", () => {
      const input: SkillScore[] = [
        { skill: "React", score: 20, topic: "React Hooks" },
      ];

      const result = engine.generateRecommendations(input);

      expect(determinePriority(20)).toBe("critical");
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        skill: "React",
        priority: "critical",
        recommendation: "Master React Hooks",
        resourceUrl: "https://react.dev",
      });
      expect(result[1].recommendation).toBe("State Management Fundamentals");
      expect(result[2].recommendation).toBe("Component Lifecycle Patterns");
    });
  });

  describe("REC-002: 40 <= Score <= 60 resolves to High", () => {
    it("should assign high priority for score 50 and map JavaScript high topics", () => {
      const input: SkillScore[] = [
        { skill: "JavaScript", score: 50, topic: "Asynchronous" },
      ];

      const result = engine.generateRecommendations(input);

      expect(determinePriority(50)).toBe("high");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        skill: "JavaScript",
        priority: "high",
        recommendation: "Event Loop & Concurrency Model",
        resourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      });
      expect(result[1].recommendation).toBe(
        "Prototypal Inheritance & Prototypes",
      );
    });
  });

  describe("REC-003: 60 < Score <= 80 resolves to Medium", () => {
    it("should assign medium priority for score 70 and map TypeScript medium topics", () => {
      const input: SkillScore[] = [
        { skill: "TypeScript", score: 70, topic: "Generics" },
      ];

      const result = engine.generateRecommendations(input);

      expect(determinePriority(70)).toBe("medium");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        skill: "TypeScript",
        priority: "medium",
        recommendation: "Utility Types (Partial, Pick, Omit)",
        resourceUrl: "https://www.typescriptlang.org/docs/",
      });
      expect(result[1].recommendation).toBe(
        "Advanced Type Manipulation (Conditional Types)",
      );
    });
  });

  describe("REC-004: Score > 80 resolves to Low", () => {
    it("should assign low priority for score 90 and map NestJS low topics", () => {
      const input: SkillScore[] = [
        { skill: "NestJS", score: 90, topic: "Dependency Injection" },
      ];

      const result = engine.generateRecommendations(input);

      expect(determinePriority(90)).toBe("low");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        skill: "NestJS",
        priority: "low",
        recommendation: "Microservices & Monorepo Architecture in NestJS",
        resourceUrl: "https://docs.nestjs.com",
      });
      expect(result[1].recommendation).toBe(
        "Custom Decorators & Dynamic Modules",
      );
    });
  });

  describe("REC-005: Unknown Skill Fallback Logic", () => {
    it("should fallback to General Learning Path for unrecognized skills", () => {
      const input: SkillScore[] = [
        { skill: "Python", score: 30, topic: "Syntax" },
      ];

      const result = engine.generateRecommendations(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        skill: "Python",
        priority: "critical",
        recommendation: "Review general software engineering best practices.",
        resourceUrl: "https://google.github.io/styleguide/",
      });
    });

    it("should apply fallback for unrecognized skills with high priority", () => {
      const input: SkillScore[] = [
        { skill: "Docker", score: 55, topic: "Containers" },
      ];

      const result = engine.generateRecommendations(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        skill: "Docker",
        priority: "high",
        recommendation:
          "Review basic programming design patterns and system analysis.",
        resourceUrl: "https://google.github.io/styleguide/",
      });
    });
  });

  describe("REC-006: Duplicate Recommendation Rules Deduplication", () => {
    it("should deduplicate identical recommendation strings within a single skill execution", () => {
      // If we pass two identical evaluations, they map to the same topics under critical.
      // The deduplication logic must clean up the array so that duplicates do not exist.
      const input: SkillScore[] = [
        { skill: "React", score: 25, topic: "Hooks" },
        { skill: "React", score: 30, topic: "State" },
      ];

      const result = engine.generateRecommendations(input);

      // Without deduplication, we would have 3 + 3 = 6 entries.
      // With deduplication, we expect exactly 3 entries.
      expect(result).toHaveLength(3);
      expect(result[0].recommendation).toBe("Master React Hooks");
      expect(result[1].recommendation).toBe("State Management Fundamentals");
      expect(result[2].recommendation).toBe("Component Lifecycle Patterns");
    });

    it("should directly verify the removeDuplicates utility function", () => {
      const dups: RecommendationDto[] = [
        {
          skill: "React",
          priority: "critical",
          recommendation: "Master React Hooks",
          resourceUrl: "url",
        },
        {
          skill: "React",
          priority: "critical",
          recommendation: "Master React Hooks",
          resourceUrl: "url",
        },
        {
          skill: "JavaScript",
          priority: "high",
          recommendation: "Closures",
          resourceUrl: "url",
        },
        {
          skill: "React",
          priority: "critical",
          recommendation: "master react hooks ",
          resourceUrl: "url",
        }, // case/space test
      ];

      const unique = removeDuplicates(dups);
      expect(unique).toHaveLength(2);
      expect(unique[0].recommendation).toBe("Master React Hooks");
      expect(unique[1].recommendation).toBe("Closures");
    });
  });

  describe("Strict Schema Validation Constraints", () => {
    it("should throw validation error when payload contains wrong types", () => {
      const badInput1 = [
        {
          skill: "React",
          score: "twenty" as unknown as number,
          topic: "Hooks",
        },
      ];
      expect(() => engine.generateRecommendations(badInput1)).toThrow();

      const badInput2 = [
        { skill: "React", score: 120, topic: "Hooks" }, // score out of bounds > 100
      ];
      expect(() => engine.generateRecommendations(badInput2)).toThrow();

      const badInput3 = [
        { skill: "", score: 50, topic: "Hooks" }, // empty skill
      ];
      expect(() => engine.generateRecommendations(badInput3)).toThrow();

      const badInput4 = "not-an-array" as unknown as SkillScore[];
      expect(() => engine.generateRecommendations(badInput4)).toThrow();
    });
  });
});

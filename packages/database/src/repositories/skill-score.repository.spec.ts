import { PrismaClient } from "@prisma/client";
import {
  SkillScoreRepository,
  CreateSkillScoreInput,
} from "./skill-score.repository";

// ─── Mock Prisma ────────────────────────────────────────────────────────────────

const mockSkillScore = {
  createMany: jest.fn(),
  findMany: jest.fn(),
};

const mockPrisma = {
  skillScore: mockSkillScore,
} as unknown as PrismaClient;

describe("SkillScoreRepository", () => {
  let repository: SkillScoreRepository;

  beforeEach(() => {
    repository = new SkillScoreRepository(mockPrisma);
    jest.clearAllMocks();
  });

  // ─── createMany ─────────────────────────────────────────────────────────────

  describe("createMany", () => {
    it("should batch-create multiple skill scores and return count", async () => {
      const input: CreateSkillScoreInput[] = [
        {
          evaluationId: "eval-1",
          skill: "Algorithms",
          score: 85,
          feedback: "Strong problem-solving",
        },
        {
          evaluationId: "eval-1",
          skill: "System Design",
          score: 90,
          feedback: "Excellent architecture",
        },
        {
          evaluationId: "eval-1",
          skill: "Communication",
          score: 78,
          feedback: "Clear explanations",
        },
        {
          evaluationId: "eval-1",
          skill: "Data Structures",
          score: 88,
          feedback: "Solid understanding",
        },
        {
          evaluationId: "eval-1",
          skill: "Debugging",
          score: 72,
          feedback: "Needs more practice",
        },
      ];

      mockSkillScore.createMany.mockResolvedValue({ count: 5 });

      const result = await repository.createMany(input);

      expect(mockSkillScore.createMany).toHaveBeenCalledWith({
        data: input.map((s) => ({
          evaluationId: s.evaluationId,
          skill: s.skill,
          score: s.score,
          feedback: s.feedback,
        })),
      });
      expect(result.count).toBe(5);
    });

    it("should handle a single skill score", async () => {
      const input: CreateSkillScoreInput[] = [
        {
          evaluationId: "eval-1",
          skill: "Algorithms",
          score: 85,
          feedback: "Good",
        },
      ];

      mockSkillScore.createMany.mockResolvedValue({ count: 1 });

      const result = await repository.createMany(input);

      expect(result.count).toBe(1);
    });

    it("should handle an empty array", async () => {
      mockSkillScore.createMany.mockResolvedValue({ count: 0 });

      const result = await repository.createMany([]);

      expect(mockSkillScore.createMany).toHaveBeenCalledWith({ data: [] });
      expect(result.count).toBe(0);
    });
  });

  // ─── findByEvaluation ──────────────────────────────────────────────────────

  describe("findByEvaluation", () => {
    it("should return skill scores ordered by skill name", async () => {
      const expectedScores = [
        {
          id: "ss-1",
          evaluationId: "eval-1",
          skill: "Algorithms",
          score: 85,
          feedback: "Good",
        },
        {
          id: "ss-2",
          evaluationId: "eval-1",
          skill: "Communication",
          score: 78,
          feedback: "Clear",
        },
        {
          id: "ss-3",
          evaluationId: "eval-1",
          skill: "System Design",
          score: 90,
          feedback: "Excellent",
        },
      ];

      mockSkillScore.findMany.mockResolvedValue(expectedScores);

      const result = await repository.findByEvaluation("eval-1");

      expect(mockSkillScore.findMany).toHaveBeenCalledWith({
        where: { evaluationId: "eval-1" },
        orderBy: { skill: "asc" },
      });
      expect(result).toHaveLength(3);
      expect(result[0].skill).toBe("Algorithms");
      expect(result[2].skill).toBe("System Design");
    });

    it("should return empty array when no scores exist", async () => {
      mockSkillScore.findMany.mockResolvedValue([]);

      const result = await repository.findByEvaluation("eval-no-scores");

      expect(mockSkillScore.findMany).toHaveBeenCalledWith({
        where: { evaluationId: "eval-no-scores" },
        orderBy: { skill: "asc" },
      });
      expect(result).toEqual([]);
    });
  });
});

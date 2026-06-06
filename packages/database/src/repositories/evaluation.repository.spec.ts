import { PrismaClient } from "@prisma/client";
import {
  EvaluationRepository,
  CreateEvaluationInput,
  UpdateEvaluationInput,
} from "./evaluation.repository";

// ─── Mock Prisma ────────────────────────────────────────────────────────────────

const mockEvaluationResult = {
  create: jest.fn(),
  update: jest.fn(),
  findUnique: jest.fn(),
};

const mockPrisma = {
  evaluationResult: mockEvaluationResult,
} as unknown as PrismaClient;

describe("EvaluationRepository", () => {
  let repository: EvaluationRepository;

  beforeEach(() => {
    repository = new EvaluationRepository(mockPrisma);
    jest.clearAllMocks();
  });

  // ─── createEvaluation ───────────────────────────────────────────────────────

  describe("createEvaluation", () => {
    it("should create an evaluation with nested skill scores", async () => {
      const input: CreateEvaluationInput = {
        testId: "test-1",
        candidateId: "user-1",
        overallScore: 85.5,
        confidenceScore: 0.92,
        skillScores: [
          { skill: "System Design", score: 90, feedback: "Excellent" },
          { skill: "Algorithms", score: 78, feedback: "Good" },
        ],
      };

      const expectedResult = {
        id: "eval-1",
        testId: "test-1",
        userId: "user-1",
        overallScore: 85.5,
        confidenceScore: 0.92,
        communicationScore: 0,
        technicalScore: 0,
        overallRating: 0,
        notes: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        skillScores: [
          {
            id: "ss-1",
            evaluationId: "eval-1",
            skill: "System Design",
            score: 90,
            feedback: "Excellent",
          },
          {
            id: "ss-2",
            evaluationId: "eval-1",
            skill: "Algorithms",
            score: 78,
            feedback: "Good",
          },
        ],
      };

      mockEvaluationResult.create.mockResolvedValue(expectedResult);

      const result = await repository.createEvaluation(input);

      expect(mockEvaluationResult.create).toHaveBeenCalledWith({
        data: {
          testId: "test-1",
          userId: "user-1",
          overallScore: 85.5,
          confidenceScore: 0.92,
          communicationScore: 0,
          technicalScore: 0,
          overallRating: 0,
          notes: undefined,
          skillScores: {
            create: [
              { skill: "System Design", score: 90, feedback: "Excellent" },
              { skill: "Algorithms", score: 78, feedback: "Good" },
            ],
          },
        },
        include: { skillScores: true },
      });
      expect(result).toEqual(expectedResult);
      expect(result.skillScores).toHaveLength(2);
    });

    it("should create an evaluation without skill scores", async () => {
      const input: CreateEvaluationInput = {
        testId: "test-2",
        candidateId: "user-2",
        overallScore: 70,
        confidenceScore: 0.85,
      };

      const expectedResult = {
        id: "eval-2",
        testId: "test-2",
        userId: "user-2",
        overallScore: 70,
        confidenceScore: 0.85,
        communicationScore: 0,
        technicalScore: 0,
        overallRating: 0,
        notes: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        skillScores: [],
      };

      mockEvaluationResult.create.mockResolvedValue(expectedResult);

      const result = await repository.createEvaluation(input);

      expect(mockEvaluationResult.create).toHaveBeenCalledWith({
        data: {
          testId: "test-2",
          userId: "user-2",
          overallScore: 70,
          confidenceScore: 0.85,
          communicationScore: 0,
          technicalScore: 0,
          overallRating: 0,
          notes: undefined,
          skillScores: undefined,
        },
        include: { skillScores: true },
      });
      expect(result.skillScores).toHaveLength(0);
    });

    it("should create an evaluation with all optional fields", async () => {
      const input: CreateEvaluationInput = {
        testId: "test-3",
        candidateId: "user-3",
        overallScore: 92,
        confidenceScore: 0.95,
        communicationScore: 88,
        technicalScore: 95,
        overallRating: 4.6,
        notes: "Outstanding performance",
      };

      const expectedResult = {
        id: "eval-3",
        ...input,
        userId: input.candidateId,
        createdAt: new Date(),
        updatedAt: new Date(),
        skillScores: [],
      };

      mockEvaluationResult.create.mockResolvedValue(expectedResult);

      const result = await repository.createEvaluation(input);

      expect(mockEvaluationResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          communicationScore: 88,
          technicalScore: 95,
          overallRating: 4.6,
          notes: "Outstanding performance",
        }),
        include: { skillScores: true },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  // ─── updateEvaluation ──────────────────────────────────────────────────────

  describe("updateEvaluation", () => {
    it("should update only specified fields", async () => {
      const updateData: UpdateEvaluationInput = {
        overallScore: 90,
      };

      const expectedResult = {
        id: "eval-1",
        testId: "test-1",
        userId: "user-1",
        overallScore: 90,
        confidenceScore: 0.92,
        communicationScore: 0,
        technicalScore: 0,
        overallRating: 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEvaluationResult.update.mockResolvedValue(expectedResult);

      const result = await repository.updateEvaluation("eval-1", updateData);

      expect(mockEvaluationResult.update).toHaveBeenCalledWith({
        where: { id: "eval-1" },
        data: { overallScore: 90 },
      });
      expect(result.overallScore).toBe(90);
    });

    it("should update multiple fields at once", async () => {
      const updateData: UpdateEvaluationInput = {
        overallScore: 88,
        confidenceScore: 0.96,
        notes: "Updated after review",
      };

      const expectedResult = {
        id: "eval-1",
        overallScore: 88,
        confidenceScore: 0.96,
        notes: "Updated after review",
      };

      mockEvaluationResult.update.mockResolvedValue(expectedResult);

      const result = await repository.updateEvaluation("eval-1", updateData);

      expect(mockEvaluationResult.update).toHaveBeenCalledWith({
        where: { id: "eval-1" },
        data: updateData,
      });
      expect(result.overallScore).toBe(88);
      expect(result.confidenceScore).toBe(0.96);
    });
  });

  // ─── findEvaluation ────────────────────────────────────────────────────────

  describe("findEvaluation", () => {
    it("should return evaluation with skill scores when found", async () => {
      const expectedResult = {
        id: "eval-1",
        testId: "test-1",
        userId: "user-1",
        overallScore: 85.5,
        confidenceScore: 0.92,
        communicationScore: 0,
        technicalScore: 0,
        overallRating: 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        skillScores: [
          {
            id: "ss-1",
            evaluationId: "eval-1",
            skill: "System Design",
            score: 90,
            feedback: "Excellent",
          },
        ],
      };

      mockEvaluationResult.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.findEvaluation("eval-1");

      expect(mockEvaluationResult.findUnique).toHaveBeenCalledWith({
        where: { id: "eval-1" },
        include: { skillScores: true },
      });
      expect(result).toEqual(expectedResult);
      expect(result?.skillScores).toHaveLength(1);
    });

    it("should return null when evaluation is not found", async () => {
      mockEvaluationResult.findUnique.mockResolvedValue(null);

      const result = await repository.findEvaluation("non-existent-id");

      expect(mockEvaluationResult.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-id" },
        include: { skillScores: true },
      });
      expect(result).toBeNull();
    });
  });

  // ─── findByTest ────────────────────────────────────────────────────────────

  describe("findByTest", () => {
    it("should return evaluation by testId with skill scores", async () => {
      const expectedResult = {
        id: "eval-1",
        testId: "test-1",
        userId: "user-1",
        overallScore: 85.5,
        confidenceScore: 0.92,
        communicationScore: 0,
        technicalScore: 0,
        overallRating: 0,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        skillScores: [],
      };

      mockEvaluationResult.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.findByTest("test-1");

      expect(mockEvaluationResult.findUnique).toHaveBeenCalledWith({
        where: { testId: "test-1" },
        include: { skillScores: true },
      });
      expect(result).toEqual(expectedResult);
    });

    it("should return null when no evaluation exists for the test", async () => {
      mockEvaluationResult.findUnique.mockResolvedValue(null);

      const result = await repository.findByTest("test-no-eval");

      expect(result).toBeNull();
    });
  });
});

import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { prisma } from "../../client";
import { GeneratedQuestionRepository } from "../generated-question.repository";
import { QuestionPoolRepository } from "../question-pool.repository";
import { generateQuestionHash } from "../../utils/hash-question.util";

describe("Day 2 Question Storage Integration Tests", () => {
  const generatedQRepo = new GeneratedQuestionRepository();
  const poolRepo = new QuestionPoolRepository();
  let templateId: string;

  beforeAll(async () => {
    let template = await prisma.template.findUnique({
      where: { templateKey: "BASE_TIME_WORK" },
    });
    if (!template) {
      try {
        template = await prisma.template.create({
          data: {
            templateKey: "BASE_TIME_WORK",
            name: "Time and Work Base Template",
            difficulty: "MEDIUM",
            questionType: "multiple_choice",
          },
        });
      } catch (e: any) {
        if (e.code === "P2002") {
          // Fetch the template that was created concurrently by the other test
          const fetched = await prisma.template.findUnique({
            where: { templateKey: "BASE_TIME_WORK" },
          });
          if (fetched) {
            template = fetched;
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
    }
    templateId = template.id;
  });

  afterAll(async () => {
    // Cleanup generated questions from tests
    await prisma.generatedQuestion.deleteMany({
      where: {
        questionText: { startsWith: "Test Question" },
      },
    });
  });

  const createMockQ = (idParam: string, difficulty: any = "EASY") => {
    const params = { varA: idParam, varB: 10 };
    const hash = generateQuestionHash({
      templateId,
      parameters: params,
      correctAnswer: idParam,
    });
    return {
      templateId,
      questionHash: hash,
      conceptKey: "time_work",
      difficultyLevel: difficulty,
      questionType: "MULTIPLE_CHOICE" as const,
      questionText: `Test Question ${idParam}`,
      options: ["1", "2", "3", idParam],
      correctAnswer: idParam,
      solution: "Solution",
      metadata: {},
    };
  };

  it("POOL-001: Successful storage", async () => {
    const q1Data = createMockQ("q1");
    const q1 = await generatedQRepo.create(q1Data);
    expect(q1.id).toBeDefined();
  });

  it("POOL-002: Duplicate hash rejection", async () => {
    const q1Data = createMockQ("q1");
    let errorThrown = false;
    try {
      await generatedQRepo.create(q1Data);
    } catch (e: any) {
      if (e.code === "DUPLICATE_QUESTION_HASH") errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });

  it("POOL-008: Batch insert testing using skipDuplicates: true", async () => {
    const q1Data = createMockQ("q1");
    const batchData = [
      createMockQ("batch1", "MEDIUM"),
      createMockQ("batch2", "HARD"),
      q1Data, // This is a duplicate and should be skipped silently
    ];
    const insertedCount = await generatedQRepo.createMany(batchData);
    expect(insertedCount).toBe(2);
  });

  it("POOL-003 to 007: Concept filtering, pagination, and counts", async () => {
    const countAll = await poolRepo.count();
    expect(countAll).toBeGreaterThanOrEqual(3);

    const conceptQs = await poolRepo.findByConcept("time_work");
    expect(conceptQs.length).toBeGreaterThanOrEqual(3);

    const hardQs = await poolRepo.findByDifficulty("HARD");
    expect(hardQs.length).toBeGreaterThanOrEqual(1);

    const paginatedQs = await poolRepo.findQuestions(
      { conceptKey: "time_work" },
      { limit: 2, page: 1 },
    );
    expect(paginatedQs.length).toBe(2);
  });

  it("POOL-009: findRandomizedSet returns unique questions with no duplicates", async () => {
    const massData = Array.from({ length: 20 }, (_, i) =>
      createMockQ(`mass${i}`, "EASY"),
    );
    await generatedQRepo.createMany(massData);

    const randomizedSet = await poolRepo.findRandomizedSet(
      { conceptKey: "time_work" },
      10,
    );
    expect(randomizedSet.length).toBe(10);

    const uniqueIds = new Set(randomizedSet.map((q) => q.id));
    expect(uniqueIds.size).toBe(10);
  });
});

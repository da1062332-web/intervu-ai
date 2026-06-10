import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { prisma } from "../../client";
import { GeneratedQuestionRepository } from "../generated-question.repository";
import { TestConfigRepository } from "../test-config.repository";

describe("Day 1 Integration Tests", () => {
  const generatedQRepo = new GeneratedQuestionRepository();
  const configRepo = new TestConfigRepository();

  beforeAll(async () => {
    let template = await prisma.template.findUnique({
      where: { templateKey: "BASE_TIME_WORK" },
    });
    if (!template) {
      try {
        await prisma.template.create({
          data: {
            templateKey: "BASE_TIME_WORK",
            name: "Time and Work Base Template",
            difficulty: "MEDIUM",
            questionType: "multiple_choice",
          },
        });
      } catch (e: any) {
        if (e.code !== "P2002") {
          throw e;
        }
      }
    }
  });

  afterAll(async () => {
    // Cleanup the test data
    await prisma.generatedQuestion.deleteMany({
      where: { questionHash: "HASH_123" },
    });
  });

  it("TESTCFG-001: should retrieve config successfully", async () => {
    const config = await configRepo.findByConfigKey("TCS_NQT_APTITUDE");
    expect(config).toBeDefined();
    expect(config?.sections.length).toBe(2);
    expect(config?.rule).not.toBeNull();
  });

  it("GENQ-002: should enforce unique constraint on generated question hash", async () => {
    const template = await prisma.template.findFirst({
      where: { templateKey: "BASE_TIME_WORK" },
    });
    expect(template).toBeDefined();
    if (!template) return;

    const qData = {
      templateId: template.id,
      questionHash: "HASH_123",
      conceptKey: "time_work",
      difficultyLevel: "MEDIUM" as const,
      questionType: "MULTIPLE_CHOICE",
      questionText: "If A does work in 10 days...",
      options: ["1", "2", "3", "4"],
      correctAnswer: "2",
      solution: "Explanation",
      metadata: {},
    };

    // First insert should succeed
    const firstQ = await generatedQRepo.create(qData);
    expect(firstQ.id).toBeDefined();

    // Second insert should fail with DUPLICATE_QUESTION_HASH
    let errorThrown = false;
    try {
      await generatedQRepo.create(qData);
    } catch (e: any) {
      if (e.code === "DUPLICATE_QUESTION_HASH") {
        errorThrown = true;
      }
    }
    expect(errorThrown).toBe(true);
  });
});

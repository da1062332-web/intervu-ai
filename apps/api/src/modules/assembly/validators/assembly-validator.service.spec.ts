import { AssemblyValidatorService } from "./assembly-validator.service";
import { BlueprintDto } from "@intervu/shared";
import { AllocatedSectionDto } from "@intervu/shared";

describe("AssemblyValidatorService", () => {
  let validator: AssemblyValidatorService;

  beforeEach(() => {
    validator = new AssemblyValidatorService();
  });

  it("should validate a correct assembly", () => {
    const blueprint: BlueprintDto = {
      testConfigId: "cfg-1",
      totalQuestions: 2,
      totalDurationSeconds: 120,
      difficultyDistribution: { EASY: 50, MEDIUM: 50, HARD: 0 },
      sections: [
        {
          sectionKey: "sec-1",
          displayName: "Section 1",
          durationSeconds: 120,
          questionCount: 2,
          orderIndex: 0,
          topicAllocations: [
            { topicId: "topic-1", percentage: 50 },
            { topicId: "topic-2", percentage: 50 },
          ],
        },
      ],
    };

    const sections: AllocatedSectionDto[] = [
      {
        sectionKey: "sec-1",
        displayName: "Section 1",
        durationSeconds: 120,
        questionCount: 2,
        orderIndex: 0,
        questions: [
          {
            questionId: "q1",
            conceptKey: "topic-1",
            difficultyLevel: "EASY",
            questionSnapshot: { id: "q1" },
            questionHash: "h1",
            questionType: "MCQ",
            questionOrder: 1,
          } as never,
          {
            questionId: "q2",
            conceptKey: "topic-2",
            difficultyLevel: "MEDIUM",
            questionSnapshot: { id: "q2" },
            questionHash: "h2",
            questionType: "MCQ",
            questionOrder: 2,
          } as never,
        ],
      },
    ];

    const result = validator.validate(blueprint, sections);
    console.log(result.errors);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail AVL-011 if difficulty mismatch is too large", () => {
    const blueprint: BlueprintDto = {
      testConfigId: "cfg-1",
      totalQuestions: 2,
      totalDurationSeconds: 120,
      sections: [
        {
          sectionKey: "sec-1",
          displayName: "Section 1",
          durationSeconds: 120,
          questionCount: 2,
          orderIndex: 0,
          topicAllocations: [],
          difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
        },
      ],
    };

    const sections: AllocatedSectionDto[] = [
      {
        sectionKey: "sec-1",
        displayName: "Section 1",
        durationSeconds: 120,
        questionCount: 2,
        orderIndex: 0,
        questions: [
          {
            questionId: "q1",
            conceptKey: "topic-1",
            difficultyLevel: "HARD",
            questionSnapshot: { id: "q1" },
            questionHash: "h1",
            questionType: "MCQ",
          } as never,
          {
            questionId: "q2",
            conceptKey: "topic-2",
            difficultyLevel: "HARD",
            questionSnapshot: { id: "q2" },
            questionHash: "h2",
            questionType: "MCQ",
          } as never,
        ],
      },
    ];

    const result = validator.validate(blueprint, sections);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("AVL-011"))).toBe(true);
  });
});

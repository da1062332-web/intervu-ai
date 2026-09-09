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
            questionSnapshot: {
              id: "q1",
              questionText: "Sample question 1",
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: "Option A",
            },
            questionHash: "h1",
            questionType: "MCQ",
            questionOrder: 1,
          } as never,
          {
            questionId: "q2",
            conceptKey: "topic-2",
            difficultyLevel: "MEDIUM",
            questionSnapshot: {
              id: "q2",
              questionText: "Sample question 2",
              options: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
              correctAnswer: "Choice 1",
            },
            questionHash: "h2",
            questionType: "MCQ",
            questionOrder: 2,
          } as never,
        ],
      },
    ];

    const result = validator.validate(blueprint, sections);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail AVL-001 if total question count does not match blueprint", () => {
    const blueprint: BlueprintDto = {
      testConfigId: "cfg-1",
      totalQuestions: 5,
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
            questionSnapshot: {
              id: "q1",
              questionText: "Sample question 1",
              options: ["A", "B", "C", "D"],
              correctAnswer: "A",
            },
            questionHash: "h1",
            questionType: "MCQ",
          } as never,
          {
            questionId: "q2",
            conceptKey: "topic-2",
            difficultyLevel: "HARD",
            questionSnapshot: {
              id: "q2",
              questionText: "Sample question 2",
              options: ["A", "B", "C", "D"],
              correctAnswer: "A",
            },
            questionHash: "h2",
            questionType: "MCQ",
          } as never,
        ],
      },
    ];

    const result = validator.validate(blueprint, sections);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("AVL-001"))).toBe(true);
  });

  it("should accept objective questions with object options having optionText or value without duplicate false positives", () => {
    const blueprint: BlueprintDto = {
      testConfigId: "cfg-1",
      totalQuestions: 1,
      totalDurationSeconds: 120,
      difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
      sections: [
        {
          sectionKey: "sec-1",
          displayName: "Section 1",
          durationSeconds: 120,
          questionCount: 1,
          orderIndex: 0,
          topicAllocations: [{ topicId: "topic-1", percentage: 100 }],
        },
      ],
    };

    const sections: AllocatedSectionDto[] = [
      {
        sectionKey: "sec-1",
        displayName: "Section 1",
        durationSeconds: 120,
        questionCount: 1,
        orderIndex: 0,
        questions: [
          {
            questionId: "q1",
            conceptKey: "topic-1",
            difficultyLevel: "EASY",
            questionType: "MULTIPLE_CHOICE",
            questionOrder: 1,
            questionSnapshot: {
              id: "q1",
              questionText: "What is 2+2?",
              options: [
                { optionText: "Option 1: 4", isCorrect: true },
                { value: "Option 2: 3", isCorrect: false },
                { label: "Option 3: 5", isCorrect: false },
                { text: "Option 4: 6", isCorrect: false },
              ],
              correctAnswer: "Option 1: 4",
            },
            questionHash: "h1",
          } as never,
        ],
      },
    ];

    const result = validator.validate(blueprint, sections);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail AVL-014 if objective question has duplicate option texts", () => {
    const blueprint: BlueprintDto = {
      testConfigId: "cfg-1",
      totalQuestions: 1,
      totalDurationSeconds: 120,
      difficultyDistribution: { EASY: 100, MEDIUM: 0, HARD: 0 },
      sections: [
        {
          sectionKey: "sec-1",
          displayName: "Section 1",
          durationSeconds: 120,
          questionCount: 1,
          orderIndex: 0,
          topicAllocations: [{ topicId: "topic-1", percentage: 100 }],
        },
      ],
    };

    const sections: AllocatedSectionDto[] = [
      {
        sectionKey: "sec-1",
        displayName: "Section 1",
        durationSeconds: 120,
        questionCount: 1,
        orderIndex: 0,
        questions: [
          {
            questionId: "q1",
            conceptKey: "topic-1",
            difficultyLevel: "EASY",
            questionType: "MULTIPLE_CHOICE",
            questionOrder: 1,
            questionSnapshot: {
              id: "q1",
              questionText: "What is 2+2?",
              options: ["Paris", "London", "paris", "Berlin"],
              correctAnswer: "Paris",
            },
            questionHash: "h1",
          } as never,
        ],
      },
    ];

    const result = validator.validate(blueprint, sections);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("AVL-014") && e.includes("duplicate option texts"))).toBe(true);
  });
});

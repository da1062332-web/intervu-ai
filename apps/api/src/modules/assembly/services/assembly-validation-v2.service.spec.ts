import { AssemblyValidationV2Service } from "./assembly-validation-v2.service";
import { DuplicateDetectionService } from "./duplicate-detection.service";
import {
  BlueprintDto,
  BlueprintSectionDto,
  AllocatedSectionDto,
} from "@intervu/shared";

const makeBlueprint = (
  overrides: Partial<BlueprintDto> = {},
): BlueprintDto => ({
  testConfigId: "cfg-1",
  totalQuestions: 4,
  totalDurationSeconds: 3600,
  sections: [
    {
      sectionKey: "SEC-A",
      displayName: "Section A",
      durationSeconds: 1800,
      questionCount: 4,
      orderIndex: 0,
      topicAllocations: [{ topicId: "math", percentage: 100 }],
      difficultyDistribution: { EASY: 25, MEDIUM: 50, HARD: 25 },
    } as BlueprintSectionDto,
  ],
  ...overrides,
});

const makeSection = (
  questionCount: number,
  key = "SEC-A",
): AllocatedSectionDto => ({
  sectionKey: key,
  displayName: key,
  durationSeconds: 1800,
  questionCount,
  orderIndex: 0,
  questions: Array.from({ length: questionCount }, (_, i) => ({
    questionId: `q${i + 1}`,
    questionHash: `q${i + 1}`,
    conceptKey: "math",
    difficultyLevel: i % 2 === 0 ? "EASY" : "MEDIUM",
    questionType: "MULTIPLE_CHOICE",
    questionOrder: i + 1,
    questionSnapshot: {},
  })),
});

describe("AssemblyValidationV2Service", () => {
  let service: AssemblyValidationV2Service;
  let dupeDetection: DuplicateDetectionService;

  beforeEach(() => {
    dupeDetection = new DuplicateDetectionService();
    service = new AssemblyValidationV2Service(dupeDetection);
  });

  it("returns valid=true for correctly assembled test", () => {
    const bp = makeBlueprint();
    const sections = [makeSection(4)];
    const result = service.validate(bp, sections);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.coverage).toBe(100);
  });

  it("returns valid=false for question count mismatch", () => {
    const bp = makeBlueprint({ totalQuestions: 10 });
    const sections = [makeSection(4)]; // only 4, need 10
    const result = service.validate(bp, sections);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("AVL-001"))).toBe(true);
  });

  it("returns valid=false for section count mismatch", () => {
    const bp = makeBlueprint();
    const result = service.validate(bp, []); // 0 sections, need 1
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("AVL-002"))).toBe(true);
  });

  it("detects and reports duplicates", () => {
    const bp = makeBlueprint({ totalQuestions: 2 });
    const section: AllocatedSectionDto = {
      sectionKey: "SEC-A",
      displayName: "Section A",
      durationSeconds: 1800,
      questionCount: 2,
      orderIndex: 0,
      questions: [
        {
          questionId: "q1",
          questionHash: "q1",
          conceptKey: "math",
          difficultyLevel: "EASY",
          questionType: "MCQ",
          questionOrder: 1,
          questionSnapshot: {},
        },
        {
          questionId: "q1",
          questionHash: "q1",
          conceptKey: "math",
          difficultyLevel: "EASY",
          questionType: "MCQ",
          questionOrder: 2,
          questionSnapshot: {},
        }, // duplicate
      ],
    };
    const result = service.validate(
      makeBlueprint({ sections: [{ ...bp.sections[0], questionCount: 2 }] }),
      [section],
    );
    expect(result.duplicateCount).toBeGreaterThan(0);
  });

  it("computes coverage correctly", () => {
    const bp = makeBlueprint({ totalQuestions: 4 });
    const sections = [makeSection(4)];
    const result = service.validate(bp, sections);
    expect(result.coverage).toBe(100);
  });

  it("returns sectionBreakdown with correct data", () => {
    const bp = makeBlueprint();
    const sections = [makeSection(4)];
    const result = service.validate(bp, sections);
    expect(result.sectionBreakdown).toBeDefined();
    expect(result.sectionBreakdown!.length).toBe(1);
    expect(result.sectionBreakdown![0].sectionKey).toBe("SEC-A");
  });
});

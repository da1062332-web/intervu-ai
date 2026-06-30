import { DuplicateDetectionService } from "./duplicate-detection.service";
import { AllocatedSectionDto } from "@intervu/shared";

const makeQuestion = (id: string, hash?: string, order = 1) => ({
  questionId: id,
  questionHash: hash ?? id,
  conceptKey: "math",
  difficultyLevel: "MEDIUM",
  questionType: "MULTIPLE_CHOICE",
  questionOrder: order,
  questionSnapshot: {},
});

const makeSection = (
  key: string,
  questions: ReturnType<typeof makeQuestion>[],
): AllocatedSectionDto => ({
  sectionKey: key,
  displayName: key,
  durationSeconds: 600,
  questionCount: questions.length,
  orderIndex: 0,
  questions,
});

describe("DuplicateDetectionService", () => {
  let service: DuplicateDetectionService;

  beforeEach(() => {
    service = new DuplicateDetectionService();
  });

  it("returns zero duplicates for clean assembly", () => {
    const sections = [
      makeSection("A", [makeQuestion("q1"), makeQuestion("q2")]),
      makeSection("B", [makeQuestion("q3"), makeQuestion("q4")]),
    ];
    const result = service.detectDuplicates(sections);
    expect(result.totalDuplicateCount).toBe(0);
    expect(result.crossSectionDuplicates).toHaveLength(0);
  });

  it("detects cross-section duplicate by ID", () => {
    const sections = [
      makeSection("A", [makeQuestion("q1"), makeQuestion("q2")]),
      makeSection("B", [makeQuestion("q1"), makeQuestion("q3")]), // q1 is duplicate
    ];
    const result = service.detectDuplicates(sections);
    expect(result.totalDuplicateCount).toBe(1);
    expect(result.crossSectionDuplicates).toHaveLength(1);
    expect(result.crossSectionDuplicates[0].questionIdA).toBe("q1");
    expect(result.crossSectionDuplicates[0].reason).toBe("EXACT_ID_MATCH");
  });

  it("detects hash-based duplicate across sections", () => {
    const sections = [
      makeSection("A", [makeQuestion("q1", "hash-abc")]),
      makeSection("B", [makeQuestion("q2", "hash-abc")]), // different ID, same hash
    ];
    const result = service.detectDuplicates(sections);
    expect(result.totalDuplicateCount).toBeGreaterThan(0);
    expect(result.crossSectionDuplicates[0].reason).toBe("EXACT_HASH_MATCH");
  });

  it("handles empty sections gracefully", () => {
    const result = service.detectDuplicates([]);
    expect(result.totalDuplicateCount).toBe(0);
    expect(result.duplicateQuestionIds).toHaveLength(0);
  });

  it("returns correct duplicateQuestionIds", () => {
    const sections = [
      makeSection("A", [makeQuestion("q1")]),
      makeSection("B", [makeQuestion("q1")]),
    ];
    const result = service.detectDuplicates(sections);
    expect(result.duplicateQuestionIds).toContain("q1");
  });
});

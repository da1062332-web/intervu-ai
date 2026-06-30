import { OverallScoreService } from "../scoring/overall-score.service";
import { SectionScoreDto } from "@intervu-ai/contracts";

describe("OverallScoreService Unit Tests", () => {
  let service: OverallScoreService;

  beforeEach(() => {
    service = new OverallScoreService();
  });

  it("should calculate overall scoring correctly from sections", () => {
    const sectionScores: SectionScoreDto[] = [
      {
        sectionKey: "s1",
        sectionName: "Sec 1",
        correct: 3,
        incorrect: 1,
        skipped: 1,
        marks: 3,
        accuracy: 60,
      },
      {
        sectionKey: "s2",
        sectionName: "Sec 2",
        correct: 4,
        incorrect: 0,
        skipped: 1,
        marks: 4,
        accuracy: 80,
      },
    ];

    const overall = service.calculateOverallScore(sectionScores);

    // Total questions: (3+1+1) + (4+0+1) = 10
    // Correct: 3 + 4 = 7
    // Attempted: 3+1 (4) + 4+0 (4) = 8
    expect(overall.totalMarks).toBe(7);
    expect(overall.percentage).toBe(70); // 7/10 -> 70%
    expect(overall.accuracy).toBe(88); // 7/8 -> 87.5% rounded to 88%
    expect(overall.normalizedScore).toBe(70);
  });
});

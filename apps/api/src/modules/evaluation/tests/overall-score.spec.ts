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
        accuracy: 75,
        totalQuestions: 5,
        attempted: 4,
        maxMarks: 5,
        percentage: 60,
      },
      {
        sectionKey: "s2",
        sectionName: "Sec 2",
        correct: 4,
        incorrect: 0,
        skipped: 1,
        marks: 4,
        accuracy: 100,
        totalQuestions: 5,
        attempted: 4,
        maxMarks: 5,
        percentage: 80,
      },
    ];

    // 3 objective eval results, 0 coding eval results
    const objectiveEvalResults = [
      { questionId: "q1", isCorrect: true, score: 1, maxMarks: 1, candidateAnswer: "a", correctAnswer: "a", timeSpentSeconds: 10 },
      { questionId: "q2", isCorrect: false, score: 0, maxMarks: 1, candidateAnswer: "b", correctAnswer: "a", timeSpentSeconds: 5 },
      { questionId: "q3", isCorrect: true, score: 1, maxMarks: 1, candidateAnswer: "c", correctAnswer: "c", timeSpentSeconds: 8 },
    ];

    const overall = service.calculateOverallScore(sectionScores, objectiveEvalResults, []);

    // Total marks: 3 + 4 = 7, maxMarks: 10
    expect(overall.totalMarks).toBe(7);
    expect(overall.percentage).toBe(70); // 7/10 -> 70%
    expect(overall.normalizedScore).toBe(70);
    expect(overall.objectiveScore).toBe(2); // 2 correct of 3 objective
    expect(overall.codingScore).toBe(0);
    expect(overall.passed).toBe(true); // 70% >= 40%
  });
});

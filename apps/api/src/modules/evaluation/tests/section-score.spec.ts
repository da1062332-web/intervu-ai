import { SectionScoringService } from "../scoring/section-scoring.service";
import { QuestionEvaluationResult } from "../objective/objective-evaluator.service";

describe("SectionScoringService Unit Tests", () => {
  let service: SectionScoringService;

  beforeEach(() => {
    service = new SectionScoringService();
  });

  it("should calculate section-wise metrics correctly", () => {
    const evalResults: QuestionEvaluationResult[] = [
      {
        questionId: "q1",
        isCorrect: true,
        score: 1,
        maxMarks: 1,
        candidateAnswer: "A",
        correctAnswer: "A",
        timeSpentSeconds: 10,
      },
      {
        questionId: "q2",
        isCorrect: false,
        score: 0,
        maxMarks: 1,
        candidateAnswer: "B",
        correctAnswer: "C",
        timeSpentSeconds: 15,
      },
      {
        questionId: "q3",
        isCorrect: false,
        score: 0,
        maxMarks: 1,
        candidateAnswer: "", // skipped
        correctAnswer: "D",
        timeSpentSeconds: 0,
      },
    ];

    const sections = [
      {
        id: "s1",
        sectionKey: "sec_aptitude",
        sectionName: "Aptitude Section",
        questions: [
          { questionId: "q1" },
          { questionId: "q2" },
          { questionId: "q3" },
        ],
      },
    ];

    const scores = service.calculateSectionScores(evalResults, sections);

    expect(scores.length).toBe(1);
    expect(scores[0].sectionKey).toBe("sec_aptitude");
    expect(scores[0].correct).toBe(1);
    expect(scores[0].incorrect).toBe(1);
    expect(scores[0].skipped).toBe(1);
    expect(scores[0].marks).toBe(1);
    expect(scores[0].accuracy).toBe(33); // 1 out of 3 total questions -> 33%
  });
});

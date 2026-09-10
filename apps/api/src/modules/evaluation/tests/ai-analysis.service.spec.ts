import { AiAnalysisService } from "../insights/ai-analysis.service";

describe("AiAnalysisService (FIX-09 Section-wise AI Evaluation)", () => {
  let service: AiAnalysisService;
  let prismaMock: any;
  let llmAdapterMock: any;

  beforeEach(() => {
    prismaMock = {
      topic: { findMany: jest.fn().mockResolvedValue([]) },
      concept: { findMany: jest.fn().mockResolvedValue([]) },
      testInstance: { findUnique: jest.fn() },
    };
    llmAdapterMock = {
      generate: jest.fn(),
    };
    service = new AiAnalysisService(prismaMock as any, llmAdapterMock as any);
  });

  it("should generate both global analysis and structured sectionAnalyses for all assessment sections", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue({
      id: "att_1",
      testConfig: { displayName: "TCS NQT Full Mock" },
      candidateResult: { percentage: 78, qualification: "DIGITAL" },
      evaluationAnalytics: {
        completionRate: 100,
        topicAccuracy: { topic_1: 85, topic_2: 45 },
        difficultyAccuracy: { EASY: 90, MEDIUM: 75, HARD: 60 },
        sectionAccuracy: [
          { sectionName: "Numerical Ability", accuracy: 80, correct: 16, wrong: 4, questionCount: 20 },
          { sectionName: "Verbal Ability", accuracy: 75, correct: 15, wrong: 5, questionCount: 20 },
          { sectionName: "Reasoning Ability", accuracy: 85, correct: 17, wrong: 3, questionCount: 20 },
          { sectionName: "Advanced Quantitative", accuracy: 70, correct: 7, wrong: 3, questionCount: 10 },
          { sectionName: "Coding Section", accuracy: 100, correct: 2, wrong: 0, questionCount: 2 },
        ],
      },
    });

    llmAdapterMock.generate.mockResolvedValue(
      JSON.stringify({
        summary: "Candidate performed admirably across foundational and advanced sections.",
        practiceHours: 12,
        strengths: [
          { title: "Strong Quantitative Acumen", detail: "Exhibited strong spatial problem solving." },
        ],
        weaknesses: [
          { title: "Verbal Speed", detail: "Requires targeted revision on vocabulary." },
        ],
        recommendations: [
          { priority: "HIGH", title: "Practice Coding Drills", action: "Daily algorithmic implementation." },
        ],
        sectionAnalyses: [
          {
            sectionName: "Numerical Ability",
            summary: "Excellent numeracy foundations.",
            strengths: ["Arithmetic speed"],
            weaknesses: [],
            recommendations: ["Maintain current momentum"],
          },
          {
            sectionName: "Coding Section",
            summary: "Flawless code execution.",
            strengths: ["Clean syntax and edge case handling"],
            weaknesses: [],
            recommendations: ["Practice dynamic programming"],
          },
        ],
      }),
    );

    const result = await service.generateAnalysis("att_1");

    expect(result.summary).toBeDefined();
    expect(result.practiceHours).toBe(12);
    expect(result.strengths).toHaveLength(1);
    expect(result.weaknesses).toHaveLength(1);
    expect(result.recommendations).toHaveLength(1);

    // Verify all 5 sections are present in sectionAnalyses
    expect(result.sectionAnalyses).toBeDefined();
    expect(result.sectionAnalyses).toHaveLength(5);
    const sectionNames = result.sectionAnalyses!.map((s) => s.sectionName);
    expect(sectionNames).toContain("Numerical Ability");
    expect(sectionNames).toContain("Verbal Ability");
    expect(sectionNames).toContain("Reasoning Ability");
    expect(sectionNames).toContain("Advanced Quantitative");
    expect(sectionNames).toContain("Coding Section");
  });

  it("should gracefully use fallback section analysis when LLM fails or produces malformed JSON", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue({
      id: "att_2",
      testConfig: { displayName: "Standard 3-Section Exam" },
      candidateResult: { percentage: 40, qualification: "NOT_QUALIFIED" },
      evaluationAnalytics: {
        completionRate: 100,
        topicAccuracy: { topic_1: 40 },
        sectionAccuracy: [
          { sectionName: "Section A", accuracy: 50 },
          { sectionName: "Section B", accuracy: 30 },
          { sectionName: "Section C", accuracy: 40 },
        ],
      },
    });

    llmAdapterMock.generate.mockRejectedValue(new Error("LLM rate limit"));

    const result = await service.generateAnalysis("att_2");

    expect(result.summary).toBeDefined();
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.weaknesses.length).toBeGreaterThan(0);
    expect(result.sectionAnalyses).toHaveLength(3);
    expect(result.sectionAnalyses![0].sectionName).toBe("Section A");
    expect(result.sectionAnalyses![1].sectionName).toBe("Section B");
    expect(result.sectionAnalyses![2].sectionName).toBe("Section C");
  });
});

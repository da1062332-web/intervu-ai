import { Test, TestingModule } from "@nestjs/testing";
import { ContentCoverageService } from "../services/content-coverage.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionStatus } from "@prisma/client";

describe("ContentCoverageService", () => {
  let service: ContentCoverageService;
  let prisma: PrismaService;

  const mockTopics = [
    {
      id: "topic-1",
      name: "React",
      questions: [
        {
          id: "q-1",
          difficulty: "EASY",
          timesUsed: 0,
          status: QuestionStatus.VALIDATED,
        },
        {
          id: "q-2",
          difficulty: "MEDIUM",
          timesUsed: 0,
          status: QuestionStatus.VALIDATED,
        },
      ],
    },
    {
      id: "topic-2",
      name: "Docker",
      questions: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentCoverageService,
        {
          provide: PrismaService,
          useValue: {
            topic: {
              findMany: jest.fn().mockResolvedValue(mockTopics),
            },
            question: {
              findMany: jest.fn().mockResolvedValue([
                {
                  id: "q-1",
                  questionText: "React Q1",
                  topic: { name: "React" },
                  difficulty: "EASY",
                },
              ]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ContentCoverageService>(ContentCoverageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should calculate correct topic gaps, difficulty gaps, and unused questions", async () => {
    const result = await service.calculateCoverage();

    // Topic 2 has 0 questions -> missingTopics
    expect(result.missingTopics).toContain("Docker");

    // Topic 1 has 2 questions (< 10) -> lowCoverageTopics
    const lowCoverage = result.lowCoverageTopics.find(
      (t) => t.topic === "React",
    );
    expect(lowCoverage).toBeDefined();
    expect(lowCoverage?.count).toBe(2);

    // Topic 1 lacks HARD difficulty -> difficultyGaps
    const gap = result.difficultyGaps.find((g) => g.topic === "React");
    expect(gap).toBeDefined();
    expect(gap?.missingDifficulties).toContain("HARD");

    // Check unused questions returned
    expect(result.unusedQuestions.length).toBeGreaterThan(0);
    expect(result.unusedQuestions[0].questionText).toBe("React Q1");
  });
});

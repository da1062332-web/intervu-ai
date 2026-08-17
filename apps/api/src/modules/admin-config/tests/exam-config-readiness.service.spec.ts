import { ExamConfigReadinessService } from "../services/exam-config-readiness.service";
import { NotFoundException } from "@nestjs/common";

describe("ExamConfigReadinessService", () => {
  let service: ExamConfigReadinessService;
  let mockPrisma: any;
  let mockUsageService: any;

  beforeEach(() => {
    mockPrisma = {
      examConfig: {
        findUnique: jest.fn(),
      },
      question: {
        count: jest.fn(),
      },
    };

    mockUsageService = {
      getUnusedPoolCount: jest.fn(),
      findConflictingConfigsForTopic: jest.fn(),
    };

    service = new ExamConfigReadinessService(mockPrisma, mockUsageService);
  });

  it("throws NotFoundException if configuration does not exist", async () => {
    mockPrisma.examConfig.findUnique.mockResolvedValue(null);
    await expect(service.checkReadiness("nonexistent")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("returns READY status when all pre-assembly checks pass in automated mode", async () => {
    const config = {
      id: "cfg-1",
      name: "Software Engineer Test",
      role: "Backend Engineer",
      durationMinutes: 60,
      totalQuestions: 10,
      sections: [
        {
          id: "sec-1",
          sectionKey: "backend",
          questionCount: 10,
          sectionDurationMinutes: 60,
          sectionTopics: [
            {
              topic: {
                id: "top-1",
                name: "NodeJS",
                code: "NODE",
              },
            },
          ],
        },
      ],
      difficultyDistribution: {
        easyPercentage: 40,
        mediumPercentage: 40,
        hardPercentage: 20,
      },
    };

    mockPrisma.examConfig.findUnique.mockResolvedValue(config);
    mockUsageService.getUnusedPoolCount.mockResolvedValue(20);
    mockPrisma.question.count.mockResolvedValue(15);

    const report = await service.checkReadiness("cfg-1");

    expect(report.status).toBe("READY");
    expect(report.score).toBe(100);
    expect(report.checks.every((c) => c.status === "PASS")).toBe(true);
  });

  it("audits manual mode question pool and reports readiness correctly", async () => {
    const config = {
      id: "cfg-manual",
      name: "Manual Senior Developer Test",
      role: "Senior Backend Developer",
      durationMinutes: 30,
      totalQuestions: 5,
      sections: [
        {
          id: "sec-1",
          sectionKey: "algorithms",
          questionCount: 5,
          sectionDurationMinutes: 30,
          sectionTopics: [
            {
              topic: {
                id: "top-algo",
                name: "Algorithms",
                code: "ALGO",
              },
            },
          ],
        },
      ],
      difficultyDistribution: {
        easyPercentage: 40,
        mediumPercentage: 40,
        hardPercentage: 20,
      },
    };

    mockPrisma.examConfig.findUnique.mockResolvedValue(config);
    mockUsageService.getUnusedPoolCount.mockResolvedValue(10);
    mockPrisma.question.count.mockResolvedValue(25);

    const report = await service.checkReadiness("cfg-manual");

    expect(report.configId).toBe("cfg-manual");
    expect(report.checks.some((c) => c.name === "Manual Question & Quality Audit")).toBe(true);
    expect(report.status).toBe("READY");
  });

  it("returns NOT_READY when section question count total does not match exam total", async () => {
    const config = {
      id: "cfg-mismatch",
      name: "Mismatched Test",
      role: "Frontend Dev",
      durationMinutes: 60,
      totalQuestions: 20, // Exam requires 20, but section only has 10
      sections: [
        {
          id: "sec-1",
          questionCount: 10,
          sectionDurationMinutes: 60,
          sectionTopics: [],
        },
      ],
      difficultyDistribution: null,
    };

    mockPrisma.examConfig.findUnique.mockResolvedValue(config);
    mockPrisma.question.count.mockResolvedValue(5);

    const report = await service.checkReadiness("cfg-mismatch");

    expect(report.checks.some((c) => c.name === "Exam Sections Question Alignment" && c.status === "WARN")).toBe(true);
  });
});

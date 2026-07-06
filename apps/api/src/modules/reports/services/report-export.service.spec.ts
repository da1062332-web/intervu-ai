import { Test, TestingModule } from "@nestjs/testing";
import { JsonExportService } from "./json-export.service";
import { ReportAuditService } from "./report-audit.service";

describe("ReportExportService (JSON)", () => {
  let jsonService: JsonExportService;
  let auditService: any;

  beforeEach(async () => {
    auditService = {
      logExport: jest.fn(),
      logJsonExported: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JsonExportService,
        { provide: ReportAuditService, useValue: auditService },
      ],
    }).compile();

    jsonService = module.get<JsonExportService>(JsonExportService);
  });

  it("should generate valid json export string", async () => {
    const reportData = {
      score: 100,
      rank: 1,
      percentile: 99,
      accuracy: 95,
      timeTaken: 3600,
      candidate: { fullName: "Test User", email: "test@example.com" },
      assessment: { title: "Assessment Title" },
      sectionBreakdown: [],
      topicBreakdown: [],
      difficultyBreakdown: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      improvementPlan: [],
    };
    const result = await jsonService.generateJsonExport(
      "attempt-1",
      reportData,
    );

    // Result is a JSON-serializable object payload
    expect(result.summary.overallScore).toBe(100);
    expect(result.summary.rank).toBe(1);
    expect(result.metadata.exportedAt).toBeDefined();
    expect(result.metadata.attemptId).toBe("attempt-1");
  });
});

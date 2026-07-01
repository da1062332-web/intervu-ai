import { Test, TestingModule } from "@nestjs/testing";
import { JsonExportService } from "../services/json-export.service";
import { ReportAuditService } from "../services/report-audit.service";

describe("JsonExportService", () => {
  let service: JsonExportService;
  let auditService: ReportAuditService;

  const mockAuditService = {
    logJsonExported: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JsonExportService,
        { provide: ReportAuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<JsonExportService>(JsonExportService);
    auditService = module.get<ReportAuditService>(ReportAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should format report data correctly into export structure", async () => {
    const mockReportData = {
      candidate: { fullName: "Bob Smith", email: "bob@intervu.ai" },
      assessment: { title: "C++ Systems", totalDurationSeconds: 1800 },
      score: 88,
      accuracy: 90,
      timeTaken: 1000,
      rank: 3,
      percentile: 85,
      sectionBreakdown: [],
      topicBreakdown: [],
      difficultyBreakdown: [],
      strengths: ["Memory Management"],
      weaknesses: [],
      recommendations: [],
      improvementPlan: ["All clear!"],
    };

    const jsonExport = await service.generateJsonExport(
      "attempt-abc",
      mockReportData,
    );

    expect(jsonExport.metadata.version).toBe("1.0.0");
    expect(jsonExport.metadata.attemptId).toBe("attempt-abc");
    expect(jsonExport.summary.candidateName).toBe("Bob Smith");
    expect(jsonExport.summary.overallScore).toBe(88);
    expect(jsonExport.analytics.strengths).toContain("Memory Management");
    expect(mockAuditService.logJsonExported).toHaveBeenCalledWith(
      "attempt-abc",
      { version: "1.0.0" },
    );
  });
});

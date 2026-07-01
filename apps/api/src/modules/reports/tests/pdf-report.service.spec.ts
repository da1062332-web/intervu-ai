import { Test, TestingModule } from "@nestjs/testing";
import { PdfReportService } from "../services/pdf-report.service";
import { ReportAuditService } from "../services/report-audit.service";

describe("PdfReportService", () => {
  let service: PdfReportService;
  let auditService: ReportAuditService;

  const mockAuditService = {
    logPdfExported: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfReportService,
        { provide: ReportAuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<PdfReportService>(PdfReportService);
    auditService = module.get<ReportAuditService>(ReportAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should generate a PDF buffer cleanly", async () => {
    const mockReportData = {
      candidate: { fullName: "Jane Doe", email: "jane@intervu.ai" },
      assessment: { title: "Python Advanced", totalDurationSeconds: 3600 },
      score: 92,
      accuracy: 95,
      timeTaken: 1200,
      rank: 1,
      percentile: 100,
      sectionBreakdown: [
        { section: "Coding", score: 95, correct: 9, total: 10, timeSpent: 600 },
      ],
      topicBreakdown: [],
      difficultyBreakdown: [],
      strengths: ["Coding"],
      weaknesses: [],
      recommendations: [],
      improvementPlan: ["Keep practicing!"],
    };

    const pdfBuffer = await service.generatePdfReport(
      "attempt-123",
      mockReportData,
    );

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    // PDF signature check (%PDF-1.x)
    expect(pdfBuffer.toString("utf8", 0, 4)).toBe("%PDF");
  });
});

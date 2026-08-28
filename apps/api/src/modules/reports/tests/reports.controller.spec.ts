import { Test, TestingModule } from "@nestjs/testing";
import { ReportsController } from "../controllers/reports.controller";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CandidateReportService,
  CandidateProgressService,
  PdfReportService,
  JsonExportService,
} from "../services";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";

describe("ReportsController", () => {
  let controller: ReportsController;
  let prisma: PrismaService;
  let reportService: CandidateReportService;
  let progressService: CandidateProgressService;

  const mockPrisma = {
    testInstance: {
      findUnique: jest.fn(),
    },
  };

  const mockReportService = {
    getCandidateReport: jest.fn(),
  };

  const mockProgressService = {
    getCandidateProgress: jest.fn(),
  };

  const mockPdfService = {
    generatePdfReport: jest.fn(),
  };

  const mockJsonService = {
    exportJsonReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CandidateReportService, useValue: mockReportService },
        { provide: CandidateProgressService, useValue: mockProgressService },
        { provide: PdfReportService, useValue: mockPdfService },
        { provide: JsonExportService, useValue: mockJsonService },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    prisma = module.get<PrismaService>(PrismaService);
    reportService = module.get<CandidateReportService>(CandidateReportService);
    progressService = module.get<CandidateProgressService>(
      CandidateProgressService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCandidateReport", () => {
    const attemptId = "attempt-123";
    const candidateUser: AuthUser = {
      id: "user-1",
      email: "c@skillitrix.com",
      role: "CANDIDATE",
    };
    const adminUser: AuthUser = {
      id: "admin-1",
      email: "a@skillitrix.com",
      role: "ADMIN",
    };

    it("should throw NotFoundException if attempt is not found", async () => {
      mockPrisma.testInstance.findUnique.mockResolvedValue(null);

      await expect(
        controller.getCandidateReport(attemptId, candidateUser),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if candidate does not own the attempt", async () => {
      mockPrisma.testInstance.findUnique.mockResolvedValue({
        id: attemptId,
        userId: "user-2",
      });

      await expect(
        controller.getCandidateReport(attemptId, candidateUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should allow candidate to retrieve their own report", async () => {
      mockPrisma.testInstance.findUnique.mockResolvedValue({
        id: attemptId,
        userId: "user-1",
      });
      mockReportService.getCandidateReport.mockResolvedValue({ score: 85 });

      const res = await controller.getCandidateReport(attemptId, candidateUser);
      expect(res).toEqual({ score: 85 });
      expect(mockReportService.getCandidateReport).toHaveBeenCalledWith(
        "user-1",
        attemptId,
      );
    });

    it("should allow admin to retrieve any candidate's report", async () => {
      mockPrisma.testInstance.findUnique.mockResolvedValue({
        id: attemptId,
        userId: "user-2",
      });
      mockReportService.getCandidateReport.mockResolvedValue({ score: 90 });

      const res = await controller.getCandidateReport(attemptId, adminUser);
      expect(res).toEqual({ score: 90 });
      expect(mockReportService.getCandidateReport).toHaveBeenCalledWith(
        "user-2",
        attemptId,
      );
    });
  });

  describe("getCandidateProgress", () => {
    const candidateUser: AuthUser = {
      id: "user-1",
      email: "c@skillitrix.com",
      role: "CANDIDATE",
    };
    const adminUser: AuthUser = {
      id: "admin-1",
      email: "a@skillitrix.com",
      role: "ADMIN",
    };

    it("should fetch progress of current candidate", async () => {
      mockProgressService.getCandidateProgress.mockResolvedValue({
        progress: "good",
      });

      const res = await controller.getCandidateProgress(candidateUser);
      expect(res).toEqual({ progress: "good" });
      expect(mockProgressService.getCandidateProgress).toHaveBeenCalledWith(
        "user-1",
      );
    });

    it("should allow admin to fetch progress of another candidate", async () => {
      mockProgressService.getCandidateProgress.mockResolvedValue({
        progress: "good-2",
      });

      const res = await controller.getCandidateProgress(adminUser, "user-2");
      expect(res).toEqual({ progress: "good-2" });
      expect(mockProgressService.getCandidateProgress).toHaveBeenCalledWith(
        "user-2",
      );
    });

    it("should ignore query parameter and fetch own progress for standard candidate", async () => {
      mockProgressService.getCandidateProgress.mockResolvedValue({
        progress: "good",
      });

      const res = await controller.getCandidateProgress(
        candidateUser,
        "user-2",
      );
      expect(res).toEqual({ progress: "good" });
      expect(mockProgressService.getCandidateProgress).toHaveBeenCalledWith(
        "user-1",
      );
    });
  });
});

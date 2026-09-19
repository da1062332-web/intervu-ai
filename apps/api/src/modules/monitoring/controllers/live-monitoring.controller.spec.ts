import { Test, TestingModule } from "@nestjs/testing";
import { LiveMonitoringController } from "./live-monitoring.controller";
import { LiveMonitoringService } from "../services/live-monitoring.service";
import { AttemptRecoveryService } from "../services/attempt-recovery.service";
import { LiveAlertService } from "../services/live-alert.service";
import { CodingMonitoringService } from "../services/coding-monitoring.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("LiveMonitoringController - Bulk Actions", () => {
  let controller: LiveMonitoringController;
  let monitoringService: any;
  let recoveryService: any;

  const mockAdminUser: any = {
    id: "admin-1",
    email: "admin@intervu.ai",
    role: "ADMIN",
  };

  beforeEach(async () => {
    monitoringService = {
      resolveAssessmentId: jest.fn().mockResolvedValue("assess-1"),
      getAssessmentLiveSnapshot: jest.fn(),
      getCandidateDetail: jest.fn(),
    };

    recoveryService = {
      adminExtendTime: jest.fn().mockResolvedValue({ success: true }),
      authorizeResume: jest.fn().mockResolvedValue({ success: true }),
      adminForceSubmit: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveMonitoringController],
      providers: [
        { provide: LiveMonitoringService, useValue: monitoringService },
        { provide: AttemptRecoveryService, useValue: recoveryService },
        { provide: LiveAlertService, useValue: {} },
        { provide: CodingMonitoringService, useValue: {} },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<LiveMonitoringController>(LiveMonitoringController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should extend time in bulk for multiple candidates", async () => {
    const dto = {
      attemptIds: ["att-1", "att-2", "att-3"],
      extraMinutes: 10,
      reason: "Bulk network glitch extension",
    };

    const result = await controller.bulkExtendTime(mockAdminUser, dto);

    expect(result.total).toBe(3);
    expect(result.succeeded).toBe(3);
    expect(result.failed).toBe(0);
    expect(recoveryService.adminExtendTime).toHaveBeenCalledTimes(3);
    expect(recoveryService.adminExtendTime).toHaveBeenCalledWith(
      "assess-1",
      "att-1",
      "admin-1",
      "admin@intervu.ai",
      { extraMinutes: 10, reason: "Bulk network glitch extension" },
    );
  });

  it("should authorize resume in bulk for multiple auto-submitted candidates", async () => {
    const dto = {
      attemptIds: ["att-1", "att-2"],
      extraTimeMinutes: 5,
      reason: "Bulk recovery for interrupted session",
    };

    const result = await controller.bulkRecover(mockAdminUser, dto);

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(recoveryService.authorizeResume).toHaveBeenCalledTimes(2);
  });

  it("should force submit in bulk for multiple candidates", async () => {
    const dto = {
      attemptIds: ["att-1", "att-2"],
      reason: "Bulk force submit for offline users",
    };

    const result = await controller.bulkForceSubmit(mockAdminUser, dto);

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(recoveryService.adminForceSubmit).toHaveBeenCalledTimes(2);
  });

  it("should handle partial failures in bulk operations gracefully without crashing", async () => {
    recoveryService.adminExtendTime
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error("Attempt already completed"));

    const dto = {
      attemptIds: ["att-1", "att-2"],
      extraMinutes: 5,
    };

    const result = await controller.bulkExtendTime(mockAdminUser, dto);

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results[1].error).toBe("Attempt already completed");
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { WorkflowNotificationService } from "./workflow-notification.service";
import { Logger } from "@nestjs/common";

describe("WorkflowNotificationService", () => {
  let service: WorkflowNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowNotificationService],
    }).compile();

    service = module.get<WorkflowNotificationService>(
      WorkflowNotificationService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should handle transition events", () => {
    const spy = jest.spyOn(Logger.prototype, "log").mockImplementation();
    service.handleConfigurationCompleted({
      examId: "e1",
    } as any);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

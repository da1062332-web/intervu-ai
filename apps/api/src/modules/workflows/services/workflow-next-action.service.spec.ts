import { Test, TestingModule } from "@nestjs/testing";
import { WorkflowNextActionService } from "./workflow-next-action.service";
import { WorkflowStep, WorkflowStatus } from "@prisma/client";
import { StepStatus } from "../dto/workflow-status.dto";

describe("WorkflowNextActionService", () => {
  let service: WorkflowNextActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowNextActionService],
    }).compile();

    service = module.get<WorkflowNextActionService>(WorkflowNextActionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return retry action on FAILED", () => {
    const action = service.getNextAction({
      currentStep: WorkflowStep.CONFIGURATION,
      status: WorkflowStatus.FAILED,
      completionPercentage: 0,
      configuration: {} as StepStatus,
      questionGeneration: {} as StepStatus,
      questionReview: {} as StepStatus,
      assembly: {} as StepStatus,
      publishing: {} as StepStatus,
    });
    expect(action.actionKey).toBe("retry");
  });
});

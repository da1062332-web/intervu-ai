import { Test, TestingModule } from "@nestjs/testing";
import { ExamWorkflowOrchestrator } from "./exam-workflow.orchestrator";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { WorkflowTransactionService } from "../services/workflow-transaction.service";
import { ExamWorkflowService } from "../services/exam-workflow.service";
import { WorkflowStatusService } from "../services/workflow-status.service";
import { WorkflowTransitionGuard } from "../guards/workflow-transition.guard";
import { WorkflowEventPublisher } from "../services/workflow-event-publisher";
import { GenerationOrchestratorService } from "../../generation/services/generation-orchestrator.service";
import { AssemblyService } from "@/modules/assembly/services/test-assembly.service";

describe("ExamWorkflowOrchestrator", () => {
  let orchestrator: ExamWorkflowOrchestrator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamWorkflowOrchestrator,
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: WorkflowTransactionService,
          useValue: {
            executeTransition: jest
              .fn()
              .mockImplementation((id, cb) => cb({ id: "w1", examId: "e1" })),
          },
        },
        {
          provide: ExamWorkflowService,
          useValue: {
            getWorkflow: jest.fn().mockResolvedValue({
              id: "w1",
              examId: "e1",
              currentStep: "CONFIGURATION",
              status: "COMPLETED",
            }),
            updateWorkflow: jest.fn(),
          },
        },
        {
          provide: WorkflowStatusService,
          useValue: {
            aggregateStatus: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: WorkflowTransitionGuard,
          useValue: {},
        },
        {
          provide: WorkflowEventPublisher,
          useValue: {},
        },
        {
          provide: GenerationOrchestratorService,
          useValue: {},
        },
        {
          provide: AssemblyService,
          useValue: {},
        },
      ],
    }).compile();

    orchestrator = module.get<ExamWorkflowOrchestrator>(
      ExamWorkflowOrchestrator,
    );
  });

  it("should be defined", () => {
    expect(orchestrator).toBeDefined();
  });
});

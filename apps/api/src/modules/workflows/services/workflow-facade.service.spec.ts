import { Test, TestingModule } from "@nestjs/testing";
import { WorkflowFacadeService } from "./workflow-facade.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { ExamWorkflowService } from "./exam-workflow.service";
import { WorkflowStatusService } from "./workflow-status.service";
import { WorkflowNextActionService } from "./workflow-next-action.service";
import { ExamWorkflowOrchestrator } from "../orchestrators/exam-workflow.orchestrator";
import { WorkflowRepository } from "../repositories/workflow.repository";
import { AssemblyPublisherService } from "../../assembly/services/assembly-publisher.service";

describe("WorkflowFacadeService", () => {
  let service: WorkflowFacadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowFacadeService,
        {
          provide: RedisCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            exists: jest.fn().mockResolvedValue(false),
            delete: jest.fn(),
          },
        },
        { provide: ExamWorkflowService, useValue: {} },
        { provide: WorkflowStatusService, useValue: {} },
        { provide: WorkflowNextActionService, useValue: {} },
        { provide: ExamWorkflowOrchestrator, useValue: {} },
        { provide: WorkflowRepository, useValue: {} },
        { provide: AssemblyPublisherService, useValue: {} },
      ],
    }).compile();

    service = module.get<WorkflowFacadeService>(WorkflowFacadeService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});

import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { EventBusService } from "../integrations/event-bus/event-bus.service";
import { GenerationService } from "../../generation/services/generation.service";
import { QuestionBankService } from "../../question-bank/services/question-bank.service";
import { AssemblyService } from "../../assembly/services/test-assembly.service";
import { ExecutionService } from "../../execution/services/execution.service";
import { EvaluationService } from "../../evaluation/services/evaluation.service";

@Injectable()
export class PlatformOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(PlatformOrchestratorService.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly generationService: GenerationService,
    private readonly questionBankService: QuestionBankService,
    private readonly assemblyService: AssemblyService,
    private readonly executionService: ExecutionService,
    private readonly evaluationService: EvaluationService,
  ) {}

  onModuleInit() {
    this.logger.log("Initializing Platform Orchestrator and subscribing to event lifecycle...");

    // Register event subscriptions
    this.eventBus.subscribe("QUESTION_GENERATED", async (payload: unknown) => {
      await this.handleGenerationCompleted(payload);
    });

    this.eventBus.subscribe("QUESTION_APPROVED", async (payload: unknown) => {
      await this.handleQuestionApproved(payload);
    });

    this.eventBus.subscribe("ASSEMBLY_CREATED", async (payload: unknown) => {
      await this.handleAssemblyPublished(payload);
    });

    this.eventBus.subscribe("ASSESSMENT_STARTED", async (payload: unknown) => {
      await this.handleAssessmentStarted(payload);
    });

    this.eventBus.subscribe("ASSESSMENT_SUBMITTED", async (payload: unknown) => {
      await this.handleAssessmentSubmitted(payload);
    });

    this.eventBus.subscribe("EVALUATION_COMPLETED", async (payload: unknown) => {
      await this.handleEvaluationCompleted(payload);
    });
  }

  async handleGenerationCompleted(payload: unknown) {
    this.logger.log(`[PlatformOrchestrator] Question Generation Completed. Payload: ${JSON.stringify(payload)}`);
  }

  async handleQuestionApproved(payload: unknown) {
    this.logger.log(`[PlatformOrchestrator] Question Approved. Payload: ${JSON.stringify(payload)}`);
  }

  async handleAssemblyPublished(payload: unknown) {
    this.logger.log(`[PlatformOrchestrator] Assembly Published. Payload: ${JSON.stringify(payload)}`);
  }

  async handleAssessmentStarted(payload: unknown) {
    this.logger.log(`[PlatformOrchestrator] Assessment Started. Payload: ${JSON.stringify(payload)}`);
  }

  async handleAssessmentSubmitted(payload: unknown) {
    this.logger.log(`[PlatformOrchestrator] Assessment Submitted. Payload: ${JSON.stringify(payload)}`);
    try {
      if (payload && typeof payload === "object" && "testInstanceId" in payload) {
        const testInstanceId = (payload as Record<string, unknown>).testInstanceId;
        if (typeof testInstanceId === "string") {
          await this.evaluationService.evaluateAnswer(testInstanceId);
        }
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to trigger evaluation from orchestrator: ${errMsg}`);
    }
  }

  async handleEvaluationCompleted(payload: unknown) {
    this.logger.log(`[PlatformOrchestrator] Evaluation Completed. Payload: ${JSON.stringify(payload)}`);
  }
}

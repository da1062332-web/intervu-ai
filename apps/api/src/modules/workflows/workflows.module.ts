import { Module } from "@nestjs/common";
import { WorkflowController } from "./controllers/workflow.controller";
import { WorkflowRepository } from "./repositories/workflow.repository";
import { WorkflowTransactionService } from "./services/workflow-transaction.service";
import { ExamWorkflowService } from "./services/exam-workflow.service";
import { WorkflowStatusService } from "./services/workflow-status.service";
import { WorkflowNextActionService } from "./services/workflow-next-action.service";
import { WorkflowEventPublisher } from "./services/workflow-event-publisher";
import { WorkflowNotificationService } from "./services/workflow-notification.service";
import { WorkflowTransitionGuard } from "./guards/workflow-transition.guard";
import { ExamWorkflowOrchestrator } from "./orchestrators/exam-workflow.orchestrator";
import { WorkflowFacadeService } from "./services/workflow-facade.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { CacheModule } from "../../cache/cache.module";
import { GenerationModule } from "../generation/generation.module";
import { AssemblyModule } from "../assembly/assembly.module";
import { AdminConfigModule } from "../admin-config/admin-config.module";
import { QuestionReviewModule } from "../question-review/question-review.module";

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    GenerationModule,
    AssemblyModule,
    AdminConfigModule,
    QuestionReviewModule,
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowRepository,
    WorkflowTransactionService,
    ExamWorkflowService,
    WorkflowStatusService,
    WorkflowNextActionService,
    WorkflowEventPublisher,
    WorkflowNotificationService,
    WorkflowTransitionGuard,
    ExamWorkflowOrchestrator,
    WorkflowFacadeService,
  ],
  exports: [WorkflowFacadeService],
})
export class WorkflowsModule {}

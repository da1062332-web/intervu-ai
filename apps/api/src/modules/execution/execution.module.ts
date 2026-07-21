import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import {
  ExecutionController,
  AnswerController,
  ResumeController,
  SubmissionController,
} from "./controllers";
import { SectionController } from "./controllers/section.controller";
import {
  ExecutionService,
  ExecutionValidatorService,
  ExecutionStateService,
  AnswerService,
  AutosaveService,
  SubmissionValidationService,
  AssessmentAuditService,
  ResumeService,
  SubmissionService,
  AssessmentResilienceTestService,
} from "./services";
import { SectionAdvanceService } from "./services/section-advance.service";
import { ZombieAssessmentReconcilerService } from "./services/zombie-assessment-reconciler.service";
import {
  TestInstanceRepository,
  ExecutionStateRepository,
  CandidateAnswerRepository,
  SubmissionRepository,
} from "./repositories";
import { EVALUATION_ADAPTER } from "./interfaces/evaluation-adapter.interface";
import { ExecutionEvaluationIntegration } from "../evaluation/integrations/execution-evaluation.integration";

@Module({
  imports: [PrismaModule, EvaluationModule],
  controllers: [
    ExecutionController,
    AnswerController,
    ResumeController,
    SubmissionController,
    SectionController,
  ],
  providers: [
    TestInstanceRepository,
    ExecutionStateRepository,
    CandidateAnswerRepository,
    SubmissionRepository,
    ExecutionValidatorService,
    ExecutionStateService,
    AnswerService,
    AutosaveService,
    SubmissionValidationService,
    AssessmentAuditService,
    ResumeService,
    SubmissionService,
    ExecutionService,
    SectionAdvanceService,
    AssessmentResilienceTestService,
    ZombieAssessmentReconcilerService,
    {
      provide: EVALUATION_ADAPTER,
      useClass: ExecutionEvaluationIntegration,
    },
  ],
  exports: [
    ExecutionService,
    AnswerService,
    AutosaveService,
    SubmissionValidationService,
    AssessmentAuditService,
    ResumeService,
    SubmissionService,
    SubmissionRepository,
    ExecutionStateRepository,
  ],
})
export class ExecutionModule {}

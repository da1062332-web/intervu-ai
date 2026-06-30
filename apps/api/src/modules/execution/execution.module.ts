import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import {
  ExecutionController,
  AnswerController,
  ResumeController,
  SubmissionController,
} from "./controllers";
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
} from "./services";
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

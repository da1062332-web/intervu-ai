import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
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

@Module({
  imports: [PrismaModule],
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
    ResumeService,
    SubmissionService,
    ExecutionService,
    {
      provide: EVALUATION_ADAPTER,
      useValue: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        triggerEvaluation: async (result: any) => {
          console.log("Mock Evaluation Triggered for:", result.executionId);
        },
      },
    },
  ],
  exports: [ExecutionService, AnswerService, ResumeService, SubmissionService],
})
export class ExecutionModule {}

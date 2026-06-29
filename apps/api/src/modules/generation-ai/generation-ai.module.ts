import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "../../config/config.module";
import { AppConfigService } from "../../config/config.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { QuestionBankModule } from "../question-bank/question-bank.module";
import { QuestionReviewModule } from "../question-review/question-review.module";

import { MockAdapter } from "./adapters/mock.adapter";
import { OpenAIAdapter } from "./adapters/openai.adapter";
import { QuestionQualityService } from "./scorers/question-quality.service";
import { GenerationRetryService } from "./retry/generation-retry.service";
import { GenerationAuditService } from "./services/generation-audit.service";
import { DifficultyValidatorService } from "./validators/difficulty-validator.service";
import { DuplicateDetectorService } from "./validators/duplicate-detector.service";
import { ResponseParserService } from "./validators/response-parser.service";
import { TopicAlignmentService } from "./validators/topic-alignment.service";

import { PromptManagerService } from "./prompts/prompt-manager.service";
import { TemplateLibraryService } from "./templates/template-library.service";
import { TopicExpansionService } from "./generators/topic-expansion.service";
import { BatchGenerationService } from "./generators/batch-generation.service";
import { GenerationOrchestratorService } from "./orchestrators/generation-orchestrator.service";
import { GenerationQualityService } from "./evaluators/generation-quality.service";
import { ReviewQueueIntegration } from "./integrations/review-queue.integration";
import { GenerationJobService } from "./services/generation-job.service";

import { PromptsController } from "./controllers/prompts.controller";
import { GenerationAiController } from "./controllers/generation-ai.controller";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    QuestionBankModule,
    forwardRef(() => QuestionReviewModule),
  ],
  controllers: [PromptsController, GenerationAiController],
  providers: [
    ResponseParserService,
    TopicAlignmentService,
    DifficultyValidatorService,
    DuplicateDetectorService,
    QuestionQualityService,
    GenerationRetryService,
    GenerationAuditService,
    OpenAIAdapter,
    MockAdapter,
    PromptManagerService,
    TemplateLibraryService,
    TopicExpansionService,
    BatchGenerationService,
    GenerationOrchestratorService,
    GenerationQualityService,
    ReviewQueueIntegration,
    GenerationJobService,
    {
      provide: "LLM_ADAPTER",
      useFactory: (
        configService: AppConfigService,
        openAIAdapter: OpenAIAdapter,
        mockAdapter: MockAdapter,
      ) => {
        const useMock =
          process.env.NODE_ENV === "test" ||
          process.env.USE_MOCK_LLM === "true" ||
          !configService.openAiApiKey ||
          configService.openAiApiKey === "sk-dummy-key-for-local-development";

        return useMock ? mockAdapter : openAIAdapter;
      },
      inject: [AppConfigService, OpenAIAdapter, MockAdapter],
    },
  ],
  exports: [
    ResponseParserService,
    TopicAlignmentService,
    DifficultyValidatorService,
    DuplicateDetectorService,
    QuestionQualityService,
    GenerationRetryService,
    GenerationAuditService,
    PromptManagerService,
    TemplateLibraryService,
    TopicExpansionService,
    BatchGenerationService,
    GenerationOrchestratorService,
    GenerationQualityService,
    ReviewQueueIntegration,
    GenerationJobService,
    "LLM_ADAPTER",
  ],
})
export class GenerationAiModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "../../config/config.module";
import { AppConfigService } from "../../config/config.service";
import { MockAdapter } from "./adapters/mock.adapter";
import { OpenAIAdapter } from "./adapters/openai.adapter";
import { QuestionQualityService } from "./scorers/question-quality.service";
import { GenerationRetryService } from "./retry/generation-retry.service";
import { GenerationAuditService } from "./services/generation-audit.service";
import { DifficultyValidatorService } from "./validators/difficulty-validator.service";
import { DuplicateDetectorService } from "./validators/duplicate-detector.service";
import { ResponseParserService } from "./validators/response-parser.service";
import { TopicAlignmentService } from "./validators/topic-alignment.service";

@Module({
  imports: [ConfigModule],
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
    "LLM_ADAPTER",
  ],
})
export class GenerationAiModule {}

import { Module, OnModuleInit } from "@nestjs/common";
import { GenerationStrategy } from "@prisma/client";

import { PrismaModule } from "../../prisma/prisma.module";
import { CodingModule } from "../coding/coding.module";

// Registries
import { StrategyRegistry } from "./registry/strategy.registry";
import { ValidationRegistry } from "./registry/validation.registry";
import {
  PromptTemplateRegistry,
  VARIABLE_PROMPT_TEMPLATE,
  DATASET_PROMPT_TEMPLATE,
  HYBRID_PROMPT_TEMPLATE,
  CODING_PATTERN_PROMPT_TEMPLATE,
} from "./registry/prompt-template.registry";

// Strategies
import { VariableGenerationStrategy } from "./strategies/variable/variable-generation.strategy";
import { DatasetGenerationStrategy } from "./strategies/dataset/dataset-generation.strategy";
import { HybridGenerationStrategy } from "./strategies/hybrid/hybrid-generation.strategy";
import { CodingPatternGenerationStrategy } from "./strategies/coding-pattern/coding-pattern-generation.strategy";

// Validators
import { VariableValidator } from "./validation/variable.validator";
import { DatasetValidator } from "./validation/dataset.validator";
import { HybridValidator } from "./validation/hybrid.validator";
import { CodingPatternValidator } from "./validation/coding-pattern.validator";

// Services
import { GenerationStrategyResolver } from "./services/generation-strategy-resolver.service";
import { PromptBuilderService } from "./prompt/prompt-builder.service";
import { QuestionAssemblerService } from "./assembler/question-assembler.service";
import { QuestionRepository } from "./repository/question.repository";
import { GenerationTrackingService } from "./services/generation-tracking.service";
import { StyleValidationService } from "./services/style-validation.service";
import { CodingPatternListener } from "./listeners/coding-pattern.listener";

const PROVIDERS = [
  // Registries
  StrategyRegistry,
  ValidationRegistry,
  PromptTemplateRegistry,

  // Generation strategies
  VariableGenerationStrategy,
  DatasetGenerationStrategy,
  HybridGenerationStrategy,
  CodingPatternGenerationStrategy,

  // Validators
  VariableValidator,
  DatasetValidator,
  HybridValidator,
  CodingPatternValidator,

  // Core services
  GenerationStrategyResolver,
  PromptBuilderService,
  QuestionAssemblerService,
  QuestionRepository,
  GenerationTrackingService,
  StyleValidationService,
  CodingPatternListener,
];

@Module({
  imports: [PrismaModule, CodingModule],
  controllers: [],
  providers: PROVIDERS,
  exports: [
    GenerationStrategyResolver,
    StrategyRegistry,
    ValidationRegistry,
    CodingPatternGenerationStrategy,
    QuestionAssemblerService,
    QuestionRepository,
  ],
})
export class QuestionGenerationModule implements OnModuleInit {
  constructor(
    // Registries
    private readonly strategyRegistry: StrategyRegistry,
    private readonly validationRegistry: ValidationRegistry,
    private readonly promptRegistry: PromptTemplateRegistry,

    // Strategies
    private readonly variableStrategy: VariableGenerationStrategy,
    private readonly datasetStrategy: DatasetGenerationStrategy,
    private readonly hybridStrategy: HybridGenerationStrategy,
    private readonly codingPatternStrategy: CodingPatternGenerationStrategy,

    // Validators
    private readonly variableValidator: VariableValidator,
    private readonly datasetValidator: DatasetValidator,
    private readonly hybridValidator: HybridValidator,
    private readonly codingPatternValidator: CodingPatternValidator,
  ) {}

  onModuleInit() {
    // Register generation strategies safely
    if (this.strategyRegistry) {
      if (this.variableStrategy)
        this.strategyRegistry.register(
          GenerationStrategy.VARIABLE,
          this.variableStrategy,
        );
      if (this.datasetStrategy)
        this.strategyRegistry.register(
          GenerationStrategy.DATASET,
          this.datasetStrategy,
        );
      if (this.hybridStrategy)
        this.strategyRegistry.register(
          GenerationStrategy.HYBRID,
          this.hybridStrategy,
        );
      if (this.codingPatternStrategy)
        this.strategyRegistry.register(
          ((GenerationStrategy as any).CODING_PATTERN || "CODING_PATTERN") as GenerationStrategy,
          this.codingPatternStrategy,
        );
    }

    // Register validators safely
    if (this.validationRegistry) {
      if (this.variableValidator)
        this.validationRegistry.register(
          GenerationStrategy.VARIABLE,
          this.variableValidator,
        );
      if (this.datasetValidator)
        this.validationRegistry.register(
          GenerationStrategy.DATASET,
          this.datasetValidator,
        );
      if (this.hybridValidator)
        this.validationRegistry.register(
          GenerationStrategy.HYBRID,
          this.hybridValidator,
        );
      if (this.codingPatternValidator)
        this.validationRegistry.register(
          ((GenerationStrategy as any).CODING_PATTERN || "CODING_PATTERN") as GenerationStrategy,
          this.codingPatternValidator,
        );
    }

    // Register prompt templates safely
    if (this.promptRegistry) {
      this.promptRegistry.register(
        GenerationStrategy.VARIABLE,
        VARIABLE_PROMPT_TEMPLATE,
      );
      this.promptRegistry.register(
        GenerationStrategy.DATASET,
        DATASET_PROMPT_TEMPLATE,
      );
      this.promptRegistry.register(
        GenerationStrategy.HYBRID,
        HYBRID_PROMPT_TEMPLATE,
      );
      this.promptRegistry.register(
        ((GenerationStrategy as any).CODING_PATTERN || "CODING_PATTERN") as GenerationStrategy,
        CODING_PATTERN_PROMPT_TEMPLATE,
      );
    }
  }
}

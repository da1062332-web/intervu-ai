import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { GenerationAiModule } from "../generation-ai/generation-ai.module";
import { CodingPatternRepository } from "./repositories/coding-pattern.repository";
import { CodingOracleRepository } from "./repositories/coding-oracle.repository";
import { CodingPatternService } from "./services/coding-pattern.service";
import { CodingOracleService } from "./services/coding-oracle.service";
import { CodingPatternRegistryService } from "./services/coding-pattern-registry.service";
import { PatternExecutionService } from "./services/pattern-execution.service";
import { PreviewService } from "./services/preview.service";
import { SeededParameterGeneratorService } from "./generators/seeded-parameter-generator.service";
import { TestSuiteGeneratorService } from "./generators/test-suite-generator.service";
import { OracleRegistry } from "./oracles/oracle.registry";
import { ORACLE_PROVIDERS_TOKEN } from "./oracles/oracle.constants";
import * as StandardOracles from "./oracles/standard-oracles";
import { BaseOracle } from "./interfaces/oracle.interface";
import {
  ParameterValidator,
  ConstraintValidator,
  OracleValidator,
  TestCaseValidator,
  DifficultyValidator,
  PatternValidatorService,
} from "./validators";
import { CodingPatternController } from "./controllers/coding-pattern.controller";
import { CodingOracleController } from "./controllers/coding-oracle.controller";
import { CodingPreviewController } from "./controllers/coding-preview.controller";
import { CodingExecutionController } from "./controllers/coding-execution.controller";
import { AdminCodingSubmissionController } from "./controllers/admin-coding-submission.controller";

import { CodingPatternSelectorService } from "./services/coding-pattern-selector.service";
import { CodingStatementGeneratorService } from "./services/coding-statement-generator.service";
import { JudgeService } from "./services/judge.service";
import { CodingExecutionService } from "./services/coding-execution.service";
import { CodingContextResolverService } from "./services/coding-context-resolver.service";
import { SubmissionEvaluatorService } from "./services/submission-evaluator.service";

const standardOracleProviders = Object.values(StandardOracles).filter(
  (val) => typeof val === "function" && val.prototype,
) as any[];

@Module({
  imports: [PrismaModule, forwardRef(() => GenerationAiModule)],
  controllers: [
    CodingPatternController,
    CodingOracleController,
    CodingPreviewController,
    CodingExecutionController,
    AdminCodingSubmissionController,
  ],
  providers: [
    CodingPatternRepository,
    CodingOracleRepository,
    CodingPatternService,
    CodingOracleService,
    CodingPatternRegistryService,
    PatternExecutionService,
    PreviewService,
    CodingPatternSelectorService,
    CodingStatementGeneratorService,
    SeededParameterGeneratorService,
    TestSuiteGeneratorService,
    JudgeService,
    SubmissionEvaluatorService,
    CodingContextResolverService,
    CodingExecutionService,
    ...standardOracleProviders,
    {
      provide: ORACLE_PROVIDERS_TOKEN,
      useFactory: (...oracles: BaseOracle[]) => oracles,
      inject: standardOracleProviders,
    },
    OracleRegistry,
    ParameterValidator,
    ConstraintValidator,
    OracleValidator,
    TestCaseValidator,
    DifficultyValidator,
    PatternValidatorService,
  ],
  exports: [
    CodingPatternRepository,
    CodingOracleRepository,
    CodingPatternService,
    CodingOracleService,
    CodingPatternRegistryService,
    PatternExecutionService,
    PreviewService,
    CodingPatternSelectorService,
    CodingStatementGeneratorService,
    OracleRegistry,
    JudgeService,
    SubmissionEvaluatorService,
    CodingContextResolverService,
    CodingExecutionService,
  ],
})
export class CodingModule {}

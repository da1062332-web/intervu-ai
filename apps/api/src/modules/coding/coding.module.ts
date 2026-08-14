import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
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
import { ArrayRotationOracle } from "./oracles/array-rotation.oracle";
import { PalindromeOracle } from "./oracles/palindrome.oracle";
import {
  ArrayReverseOracle,
  ArrayMaxOracle,
  ArrayMinOracle,
  ArraySumOracle,
  ArrayCountEvenOracle,
  LinearSearchOracle,
  ArraySortedCheckOracle,
  ArrayRemoveDuplicatesOracle,
  ArraySecondLargestOracle,
  StringReverseOracle,
  StringCountVowelsOracle,
  StringCharacterCountOracle,
  StringRemoveSpacesOracle,
  StringAnagramOracle,
  StringWordCountOracle,
  StringLargestWordOracle,
  MathFactorialOracle,
  MathFibonacciOracle,
  MathPrimeCheckOracle,
  MathGcdOracle,
  MathLcmOracle,
  MathDigitSumOracle,
  MathNumberReverseOracle,
  MathDigitCountOracle,
  BinarySearchOracle,
  BubbleSortOracle,
  SelectionSortOracle,
  MergeSortedArraysOracle,
} from "./oracles/standard-oracles";
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
import { BaseOracle } from "./interfaces/oracle.interface";

import { CodingPatternSelectorService } from "./services/coding-pattern-selector.service";
import { CodingStatementGeneratorService } from "./services/coding-statement-generator.service";
import { JudgeService } from "./services/judge.service";
import { CodingExecutionService } from "./services/coding-execution.service";
import { CodingExecutionController } from "./controllers/coding-execution.controller";

import { CodingContextResolverService } from "./services/coding-context-resolver.service";

import { SubmissionEvaluatorService } from "./services/submission-evaluator.service";

import { AdminCodingSubmissionController } from "./controllers/admin-coding-submission.controller";

const standardOracleProviders = [
  ArrayRotationOracle,
  PalindromeOracle,
  ArrayReverseOracle,
  ArrayMaxOracle,
  ArrayMinOracle,
  ArraySumOracle,
  ArrayCountEvenOracle,
  LinearSearchOracle,
  ArraySortedCheckOracle,
  ArrayRemoveDuplicatesOracle,
  ArraySecondLargestOracle,
  StringReverseOracle,
  StringCountVowelsOracle,
  StringCharacterCountOracle,
  StringRemoveSpacesOracle,
  StringAnagramOracle,
  StringWordCountOracle,
  StringLargestWordOracle,
  MathFactorialOracle,
  MathFibonacciOracle,
  MathPrimeCheckOracle,
  MathGcdOracle,
  MathLcmOracle,
  MathDigitSumOracle,
  MathNumberReverseOracle,
  MathDigitCountOracle,
  BinarySearchOracle,
  BubbleSortOracle,
  SelectionSortOracle,
  MergeSortedArraysOracle,
];

@Module({
  imports: [PrismaModule],
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

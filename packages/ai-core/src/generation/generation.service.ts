import { TemplateSelectorService } from "./template-selector.service";
import { ParameterGeneratorService } from "./parameter-generator.service";
import { QuestionInstantiatorService } from "./question-instantiator.service";
import { GenerationValidationService } from "./validation/generation-validation.service";
import { GenerationRequest, GenerationResult } from "./types/generation.types";
import { PRNG, generateSeedFromString } from "./utils/random-seed.util";
import {
  GeneratedQuestionDto,
  QuestionValidationDto,
} from "@intervu-ai/contracts";
import { randomUUID } from "crypto";

export class GenerationService {
  private readonly templateSelector: TemplateSelectorService;
  private readonly parameterGenerator: ParameterGeneratorService;
  private readonly questionInstantiator: QuestionInstantiatorService;
  private readonly validationService: GenerationValidationService;

  constructor(
    templateSelector?: TemplateSelectorService,
    parameterGenerator?: ParameterGeneratorService,
    questionInstantiator?: QuestionInstantiatorService,
    validationService?: GenerationValidationService,
  ) {
    this.templateSelector = templateSelector || new TemplateSelectorService();
    this.parameterGenerator =
      parameterGenerator || new ParameterGeneratorService();
    this.questionInstantiator =
      questionInstantiator || new QuestionInstantiatorService();
    this.validationService =
      validationService || new GenerationValidationService();
  }

  /**
   * Main orchestrator method to select a template, generate parameters,
   * instantiate the question details, validate, and return the DTO.
   */
  async generateQuestion(
    request: GenerationRequest,
    seedInput: number | string,
  ): Promise<{
    question: GeneratedQuestionDto;
    validation: QuestionValidationDto;
  }> {
    // 1. Determine base seed
    let baseSeed: number;
    if (typeof seedInput === "string") {
      baseSeed = generateSeedFromString(seedInput);
    } else {
      baseSeed = seedInput;
    }

    // 2. Select matching template from DB
    const template = await this.templateSelector.selectTemplate(
      request,
      baseSeed,
    );

    // 3. Create a unique numeric seed derived from templateKey + difficulty
    const derivedSeedInput = `${template.templateKey}_${template.difficultyLevel}`;
    const derivedSeed = generateSeedFromString(derivedSeedInput);
    const prng = new PRNG(derivedSeed);

    // 4. Generate valid parameters satisfying constraints
    const parameters = this.parameterGenerator.generateParameters(
      template.variableSchema as Record<string, unknown>,
      template.constraints as Record<string, unknown>,
      prng,
    );

    // 5. Instantiate question text, correct answer, distractors, and solution steps
    const questionId = `q_${randomUUID()}`;
    const instantiated = this.questionInstantiator.instantiateQuestion(
      template.structure as Record<string, unknown>,
      template.solutionSchema as Record<string, unknown>,
      parameters,
      prng,
    );

    const result: GenerationResult = {
      questionText: instantiated.questionText,
      options: instantiated.options,
      correctAnswer: instantiated.correctAnswer,
      solution: instantiated.solution,
      difficultyLevel: template.difficultyLevel.toLowerCase() as
        | "easy"
        | "medium"
        | "hard",
      conceptKey: template.conceptKey,
      hash: template.templateKey,
      parameters,
    };

    // 6. Validate generated question details
    const validation = this.validationService.validateQuestion(
      questionId,
      result,
    );
    if (!validation.isValid) {
      throw new Error(
        `Generated question failed validation: ${validation.errors.join(", ")}`,
      );
    }

    // 7. Format into the standard GeneratedQuestionDto contract
    const question: GeneratedQuestionDto = {
      questionId,
      templateId: template.id,
      conceptKey: template.conceptKey,
      difficultyLevel: template.difficultyLevel.toLowerCase() as
        | "easy"
        | "medium"
        | "hard",
      questionType: "mcq", // default type
      questionText: result.questionText,
      options: result.options,
      correctAnswer: result.correctAnswer,
      solution: JSON.stringify(result.solution),
      metadata: result.parameters,
    };

    return {
      question,
      validation,
    };
  }
}

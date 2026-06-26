import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";

import { AssemblyPersistenceService } from "./assembly-persistence.service";
import { BlueprintBuilderService } from "./blueprint-builder.service";
import {
  QuestionAllocatorService,
  AllocationConfig,
} from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { AssemblyValidatorService } from "../validators/assembly-validator.service";
import { AllocatedSectionDto as SectionDto } from "@intervu/shared";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";

@Injectable()
export class AssemblyService {
  private readonly DEFAULT_ALLOCATION_CONFIG: AllocationConfig = {
    distribution: {
      EASY: 40,
      MEDIUM: 40,
      HARD: 20,
    },
  };
  constructor(
    private readonly persistenceService: AssemblyPersistenceService,
    private readonly blueprintBuilder: BlueprintBuilderService,
    private readonly allocator: QuestionAllocatorService,
    private readonly sectionBuilder: SectionBuilderService,
    private readonly validator: AssemblyValidatorService,
    private readonly poolRepository: QuestionPoolRepository,
  ) {}

  async assembleTest(
    configId: string,
    userId: string = "system-user",
  ): Promise<string> {
    if (!configId) throw new BadRequestException("configId is required");

    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);

    const sections: SectionDto[] = [];
    const allocatedQuestionIds = new Set<string>();

    const historyIds =
      await this.poolRepository.findRecentUsedQuestions(userId);

    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
      );

      const section = this.sectionBuilder.buildSection(
        blueprintSection,
        allocatedQuestions,
      );
      sections.push(section);
    }

    const validation = this.validator.validate(blueprint, sections);
    if (!validation.valid) {
      throw new InternalServerErrorException(
        `Assembly validation failed: ${validation.errors.join(", ")}`,
      );
    }

    const testInstanceId = await this.persistenceService.saveAssembly(
      configId,
      sections,
      userId,
    );

    return testInstanceId;
  }

  async previewTest(configId: string, userId: string = "system-user") {
    if (!configId) throw new BadRequestException("configId is required");

    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);

    const sections: SectionDto[] = [];
    const allocatedQuestionIds = new Set<string>();
    const historyIds =
      await this.poolRepository.findRecentUsedQuestions(userId);

    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
      );

      const section = this.sectionBuilder.buildSection(
        blueprintSection,
        allocatedQuestions,
      );
      sections.push(section);
    }

    const validation = this.validator.validate(blueprint, sections);
    if (!validation.valid) {
      throw new InternalServerErrorException(
        `Assembly validation failed: ${validation.errors.join(", ")}`,
      );
    }

    return {
      testInstanceId: null, // dry run
      sections,
    };
  }

  async validateTest(configId: string, userId: string = "system-user") {
    if (!configId) throw new BadRequestException("configId is required");

    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);

    const sections: SectionDto[] = [];
    const allocatedQuestionIds = new Set<string>();
    const historyIds =
      await this.poolRepository.findRecentUsedQuestions(userId);

    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        historyIds,
        this.DEFAULT_ALLOCATION_CONFIG,
      );

      const section = this.sectionBuilder.buildSection(
        blueprintSection,
        allocatedQuestions,
      );
      sections.push(section);
    }

    // Return the validation result without throwing
    return this.validator.validate(blueprint, sections);
  }

  async getAssembly(testInstanceId: string) {
    const instance = await this.persistenceService.getAssembly(testInstanceId);
    if (!instance) {
      throw new BadRequestException(
        `Test Instance ${testInstanceId} not found`,
      );
    }
    return instance;
  }
}

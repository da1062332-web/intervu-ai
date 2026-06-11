import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';

import { AssemblyRepository } from './assembly.repository';
import { BlueprintBuilderService } from './blueprint-builder.service';
import { QuestionAllocatorService, AllocationConfig } from './question-allocator.service';
import { SectionBuilderService } from './section-builder.service';
import { AssemblyValidatorService } from './assembly-validator.service';
import { SectionDto } from './dto/section.dto';

@Injectable()
export class AssemblyService {
  // Hardcoded default for MVP, but normally this would be fetched from SystemConfig or TestConfig
  private readonly DEFAULT_ALLOCATION_CONFIG: AllocationConfig = {
    distribution: {
      EASY: 40,
      MEDIUM: 40,
      HARD: 20
    }
  };

  constructor(
    private readonly repository: AssemblyRepository,
    private readonly blueprintBuilder: BlueprintBuilderService,
    private readonly allocator: QuestionAllocatorService,
    private readonly sectionBuilder: SectionBuilderService,
    private readonly validator: AssemblyValidatorService,
  ) {}

  async assembleTest(configId: string, userId: string = 'system-user'): Promise<string> {
    // 1. Validate Input (Implicitly handled by DTO, explicitly handled here if needed)
    if (!configId) throw new BadRequestException('configId is required');

    // 2. Fetch Dependencies & Generate Blueprint
    const blueprint = await this.blueprintBuilder.generateBlueprint(configId);

    // 3. Core Logic: Allocate and Build
    const sections: SectionDto[] = [];
    const allocatedQuestionIds = new Set<string>();

    for (const blueprintSection of blueprint.sections) {
      const allocatedQuestions = await this.allocator.allocateQuestions(
        blueprintSection,
        allocatedQuestionIds,
        this.DEFAULT_ALLOCATION_CONFIG
      );

      const section = this.sectionBuilder.buildSection(blueprintSection, allocatedQuestions);
      sections.push(section);
    }

    // 4. Validate Assembly
    const validation = this.validator.validate(blueprint, sections);
    if (!validation.valid) {
       throw new InternalServerErrorException(
         `Assembly validation failed: ${validation.errors.join(', ')}`
       );
    }

    // 5. Persist to DB
    const testInstanceId = await this.repository.createTestInstanceWithTransaction(
      userId,
      configId,
      sections
    );

    // 6. Format Response
    return testInstanceId;
  }

  async getAssembly(id: string) {
    const instance = await this.repository.findById(id);
    if (!instance) {
      throw new BadRequestException(`Test Instance ${id} not found`);
    }
    return instance;
  }
}

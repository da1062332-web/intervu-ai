import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { BlueprintConfigRepository } from "./blueprint-config.repository";
import { BlueprintValidatorService } from "./blueprint-validator.service";
import {
  CreateBlueprintConfigDto,
  UpdateBlueprintConfigDto,
  AddTopicConfigDto,
} from "@intervu-ai/contracts";

@Injectable()
export class BlueprintConfigService {
  constructor(
    private readonly repository: BlueprintConfigRepository,
    private readonly validator: BlueprintValidatorService,
  ) {}

  async create(dto: CreateBlueprintConfigDto) {
    const existing = await this.repository.findByCode(dto.code);
    if (existing) {
      throw new BadRequestException("BLUEPRINT_CODE_EXISTS");
    }

    return this.repository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      totalQuestions: dto.totalQuestions,
      totalDurationMinutes: dto.totalDurationMinutes,
      isActive: dto.isActive ?? true,
    });
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const blueprint = await this.repository.findById(id);
    if (!blueprint) {
      throw new NotFoundException("BLUEPRINT_NOT_FOUND");
    }
    return blueprint;
  }

  async update(id: string, dto: UpdateBlueprintConfigDto) {
    await this.findById(id);
    return this.repository.update(id, dto);
  }

  async softDelete(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async addTopicConfig(blueprintId: string, dto: AddTopicConfigDto) {
    const blueprint = await this.findById(blueprintId);

    // Check duplicate topic
    const existingTopics = await this.repository.findTopicConfigs(blueprintId);
    if (existingTopics.some((t) => t.topicId === dto.topicId)) {
      throw new BadRequestException("TOPIC_ALREADY_CONFIGURED");
    }

    // Validate difficulty
    this.validator.validateDifficulty(dto);

    // Validate question distribution
    const currentQuestions = existingTopics.reduce(
      (acc, t) => acc + t.questionCount,
      0,
    );
    const qValid = this.validator.validateQuestionDistribution(
      blueprint.totalQuestions,
      currentQuestions,
      dto.questionCount,
    );
    if (!qValid.valid) {
      throw new BadRequestException({
        message: "INVALID_QUESTION_DISTRIBUTION",
        missingQuestions: qValid.missingQuestions,
      });
    }

    // Validate weightage
    const currentWeightage = existingTopics.reduce(
      (acc, t) => acc + Number(t.weightage),
      0,
    );
    const wValid = this.validator.validateWeightage(
      currentWeightage,
      dto.weightage,
    );
    if (!wValid.valid) {
      throw new BadRequestException({
        message: "INVALID_WEIGHTAGE",
        totalWeightage: wValid.totalWeightage,
      });
    }

    return this.repository.addTopicConfig({
      blueprint: { connect: { id: blueprintId } },
      topic: { connect: { id: dto.topicId } },
      examSection: { connect: { id: dto.sectionId } },
      questionCount: dto.questionCount,
      weightage: dto.weightage,
      easyCount: dto.easyCount,
      mediumCount: dto.mediumCount,
      hardCount: dto.hardCount,
    });
  }
}

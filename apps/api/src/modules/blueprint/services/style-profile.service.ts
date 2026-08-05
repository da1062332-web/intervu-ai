import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { StyleProfileRepository } from "../repositories/style-profile.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateStyleProfileDto, UpdateStyleProfileDto } from "@intervu/shared";
import { Prisma } from "@prisma/client";

@Injectable()
export class StyleProfileService implements OnModuleInit {
  private readonly logger = new Logger(StyleProfileService.name);

  constructor(
    private readonly repository: StyleProfileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.seedWithRetries(5, 1000);
  }

  private async seedWithRetries(maxRetries: number, delayMs: number) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.seedDefaultProfiles();
        this.logger.log("Style profiles seeded successfully from database.");
        return;
      } catch (error) {
        this.logger.warn(
          `Failed to seed style profiles (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? error.message : String(error)}`,
        );
        if (attempt < maxRetries) {
          const backoffDelay = delayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        } else {
          this.logger.error(
            "Database unreachable. Failed to seed style profiles after maximum retries. Application will continue without seeding.",
          );
        }
      }
    }
  }

  async seedDefaultProfiles() {
    if (!this.repository || !this.repository.findByName) {
      return;
    }
    const defaultProfiles = [
      {
        name: "Campus Placement",
        description: "Standard entry-level assessment for college placement",
        profileType: "campus" as const,
        active: true,
        status: "ACTIVE" as const,
        isDefault: true,
        languageStyle: {
          language: "English",
          sentenceLength: "short",
          vocabularyLevel: "basic",
          grammarStyle: "formal",
        },
        contextStyle: {
          preferredContexts: ["Daily Life", "Education"],
        },
        difficultyStyle: {
          easy: ["Short", "Direct", "Single-step"],
          medium: ["Moderate wording", "Two-step reasoning"],
          hard: ["Interpretive context", "Multi-step reasoning"],
        },
        distractorRules: {
          exactlyFourOptions: true,
          oneCorrectAnswer: true,
          plausibleIncorrectOptions: true,
          avoidObviouslyWrongOptions: true,
          avoidHumorousOptions: true,
          representCommonStudentMistakes: true,
        },
        explanationStyle: {
          formulaFirst: true,
          stepWiseSolution: true,
          maxSteps: 4,
          explanationLength: "short",
          highlightFinalAnswer: true,
        },
        aiInstructions: "Keep language simple and direct. Avoid verbose phrasing.",
        characteristics: [
          { name: "questionLength", value: "short" },
          { name: "complexity", value: "low" },
          { name: "scenarioUsage", value: 0.1 },
          { name: "codeIntensity", value: 0.4 },
          { name: "theoryWeight", value: 60 },
          { name: "practicalWeight", value: 40 },
          { name: "difficultyBias", value: { easy: 60, medium: 30, hard: 10 } },
        ],
      },
      {
        name: "Experienced Hiring",
        description: "Lateral assessment for senior or lead engineers",
        profileType: "lateral" as const,
        active: true,
        status: "ACTIVE" as const,
        isDefault: false,
        languageStyle: {
          language: "English",
          sentenceLength: "medium",
          vocabularyLevel: "intermediate",
          grammarStyle: "formal",
        },
        contextStyle: {
          preferredContexts: ["Business", "Banking", "Employees"],
        },
        difficultyStyle: {
          easy: ["Direct"],
          medium: ["Moderate wording", "Two-step reasoning"],
          hard: ["Interpretive context", "Multi-step reasoning"],
        },
        distractorRules: {
          exactlyFourOptions: true,
          oneCorrectAnswer: true,
          plausibleIncorrectOptions: true,
          avoidObviouslyWrongOptions: true,
          avoidHumorousOptions: true,
          representCommonStudentMistakes: true,
        },
        explanationStyle: {
          formulaFirst: true,
          stepWiseSolution: true,
          maxSteps: 6,
          explanationLength: "medium",
          highlightFinalAnswer: true,
        },
        aiInstructions: "Provide deep technical explanations. Use realistic real-world engineering contexts.",
        characteristics: [
          { name: "questionLength", value: "long" },
          { name: "complexity", value: "high" },
          { name: "scenarioUsage", value: 0.7 },
          { name: "codeIntensity", value: 0.8 },
          { name: "theoryWeight", value: 20 },
          { name: "practicalWeight", value: 80 },
          { name: "difficultyBias", value: { easy: 20, medium: 50, hard: 30 } },
        ],
      },
      {
        name: "Leadership Hiring",
        description: "Assessment for managers, directors, or architects",
        profileType: "executive" as const,
        active: true,
        status: "ACTIVE" as const,
        isDefault: false,
        languageStyle: {
          language: "English",
          sentenceLength: "long",
          vocabularyLevel: "advanced",
          grammarStyle: "formal",
        },
        contextStyle: {
          preferredContexts: ["Business", "Education", "Daily Life"],
        },
        difficultyStyle: {
          easy: ["Direct"],
          medium: ["Moderate wording", "Two-step reasoning"],
          hard: ["Interpretive context", "Multi-step reasoning"],
        },
        distractorRules: {
          exactlyFourOptions: true,
          oneCorrectAnswer: true,
          plausibleIncorrectOptions: true,
          avoidObviouslyWrongOptions: true,
          avoidHumorousOptions: true,
          representCommonStudentMistakes: true,
        },
        explanationStyle: {
          formulaFirst: true,
          stepWiseSolution: true,
          maxSteps: 8,
          explanationLength: "long",
          highlightFinalAnswer: true,
        },
        aiInstructions: "Focus on architectural decisions, team leadership, and strategic execution trade-offs.",
        characteristics: [
          { name: "questionLength", value: "long" },
          { name: "complexity", value: "high" },
          { name: "scenarioUsage", value: 0.8 },
          { name: "codeIntensity", value: 0.2 },
          { name: "theoryWeight", value: 75 },
          { name: "practicalWeight", value: 25 },
          { name: "difficultyBias", value: { easy: 10, medium: 40, hard: 50 } },
        ],
      },
      {
        name: "Certification Exam",
        description: "Standardized certification testing profiles",
        profileType: "certification" as const,
        active: true,
        status: "ACTIVE" as const,
        isDefault: false,
        languageStyle: {
          language: "English",
          sentenceLength: "medium",
          vocabularyLevel: "intermediate",
          grammarStyle: "formal",
        },
        contextStyle: {
          preferredContexts: ["Business", "Banking", "Travel"],
        },
        difficultyStyle: {
          easy: ["Short", "Direct"],
          medium: ["Moderate wording", "Two-step reasoning"],
          hard: ["Interpretive context", "Multi-step reasoning"],
        },
        distractorRules: {
          exactlyFourOptions: true,
          oneCorrectAnswer: true,
          plausibleIncorrectOptions: true,
          avoidObviouslyWrongOptions: true,
          avoidHumorousOptions: true,
          representCommonStudentMistakes: true,
        },
        explanationStyle: {
          formulaFirst: true,
          stepWiseSolution: true,
          maxSteps: 5,
          explanationLength: "medium",
          highlightFinalAnswer: true,
        },
        aiInstructions: "Adhere closely to certification study guide terms. Ensure options are completely unambiguous.",
        characteristics: [
          { name: "questionLength", value: "medium" },
          { name: "complexity", value: "medium" },
          { name: "scenarioUsage", value: 0.2 },
          { name: "codeIntensity", value: 0.5 },
          { name: "theoryWeight", value: 80 },
          { name: "practicalWeight", value: 20 },
          { name: "difficultyBias", value: { easy: 30, medium: 50, hard: 20 } },
        ],
      },
    ];

    for (const profile of defaultProfiles) {
      const existing = await this.repository.findByName(profile.name);
      if (!existing) {
        const { characteristics, ...data } = profile;
        await this.repository.createWithCharacteristics(
          data as unknown as Prisma.StyleProfileCreateWithoutCharacteristicsInput,
          characteristics,
        );
        console.log(`Seeded Style Profile: ${profile.name}`);
      }
    }
  }

  private async handleDefaultProfileReset(isDefault?: boolean, idToSkip?: string) {
    if (isDefault) {
      await this.prisma.styleProfile.updateMany({
        where: {
          isDefault: true,
          id: idToSkip ? { not: idToSkip } : undefined,
        },
        data: { isDefault: false },
      });
    }
  }

  async create(dto: CreateStyleProfileDto) {
    await this.handleDefaultProfileReset(dto.isDefault);
    const { characteristics, ...data } = dto;
    return this.repository.createWithCharacteristics(
      data as unknown as Prisma.StyleProfileCreateWithoutCharacteristicsInput,
      characteristics || [],
    );
  }

  async findAll() {
    return this.repository.findAllWithCharacteristics();
  }

  async findOne(id: string) {
    const profile = await this.repository.findByIdWithCharacteristics(id);
    if (!profile) {
      throw new NotFoundException(`Style profile with ID ${id} not found`);
    }
    return profile;
  }

  async update(id: string, dto: UpdateStyleProfileDto) {
    await this.findOne(id);
    await this.handleDefaultProfileReset(dto.isDefault, id);
    const { characteristics, ...data } = dto;
    return this.repository.updateWithCharacteristics(
      id,
      data as unknown as Prisma.StyleProfileUpdateWithoutCharacteristicsInput,
      characteristics,
    );
  }

  async delete(id: string) {
    await this.findOne(id);
    const isReferenced = await this.prisma.blueprint.findFirst({
      where: { styleProfileId: id },
    });
    if (isReferenced) {
      throw new BadRequestException("STYLE_PROFILE_REFERENCED_BY_BLUEPRINT");
    }
    return this.repository.delete(id);
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);
    const newName = `${original.name} (Copy)`;
    const existing = await this.repository.findByName(newName);
    if (existing) {
      throw new BadRequestException("DUPLICATE_NAME_EXISTS");
    }

    const {
      id: _,
      createdAt: _c,
      updatedAt: _u,
      name,
      characteristics,
      ...rest
    } = original;

    return this.repository.createWithCharacteristics(
      {
        ...rest,
        name: newName,
        isDefault: false, // Duplicates are never default by default
      } as unknown as Prisma.StyleProfileCreateWithoutCharacteristicsInput,
      (characteristics || []).map((c) => ({
        name: c.characteristicName,
        value: c.characteristicValue,
      })),
    );
  }
}


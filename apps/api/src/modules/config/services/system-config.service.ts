import { Injectable, BadRequestException } from "@nestjs/common";
import { RedisCacheService } from "../../../cache";
import { ConfigRepository } from "../repositories/config.repository";
import { TemplateRepository } from "../../template-library/repositories/template.repository";
 
import { SystemConfigDto, SystemConfigSchema } from "../dto/system-config.dto";
 
import { UpdateSystemConfigDto } from "../dto/update-system-config.dto";
import { Template } from "@prisma/client";

const CACHE_KEY = "config:system";
const CACHE_TTL = 3600; // 1 hour

const SAFE_DEFAULTS = {
  difficultyLevels: [
    {
      id: "easy",
      name: "Easy",
      timeLimitSeconds: 60,
      weight: 1.0,
      isActive: true,
      passingScore: 60,
    },
    {
      id: "medium",
      name: "Medium",
      timeLimitSeconds: 120,
      weight: 2.0,
      isActive: true,
      passingScore: 70,
    },
    {
      id: "hard",
      name: "Hard",
      timeLimitSeconds: 180,
      weight: 3.0,
      isActive: true,
      passingScore: 80,
    },
  ],
  generationRules: {
    defaultModel: "gpt-4",
    temperature: 0.7,
    maxTokens: 1000,
    temperaturePresets: { easy: 0.5, medium: 0.7, hard: 0.9 },
    retryCount: 3,
  },
  validationRules: {
    strictMode: true,
    maxValidationErrors: 5,
    allowedTypes: ["multiple-choice", "coding", "free-text"],
    allowUnknownFields: false,
  },
  queueSettings: {
    concurrency: { generation: 5, evaluation: 2, analytics: 10 },
    jobTimeoutMs: 30000,
    maxAttempts: 3,
    backoffDelayMs: 5000,
  },
  environmentFlags: {
    maintenanceMode: false,
    enableWorker: true,
    debugMode: false,
    enableCaching: true,
  },
};

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  /**
   * Pipeline: validate() -> fetchDependencies() -> coreLogic() -> formatResponse()
   */
  async getSystemConfig(): Promise<SystemConfigDto> {
    // 1. validate() -> No input, so validation is trivial.

    // 2. fetchDependencies() -> Load from Cache if active
    const cached = await this.cacheService.get<SystemConfigDto>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    // 3. coreLogic() -> Fetch from DB / fallback to safe defaults
    const [difficulty, generation, validation, queue, envFlags] =
      await Promise.all([
        this.configRepository.findById("difficulty"),
        this.configRepository.findById("generation"),
        this.configRepository.findById("validation"),
        this.configRepository.findById("queue"),
        this.configRepository.findById("envFlags"),
      ]);

    const mergedConfig: SystemConfigDto = {
      difficultyLevels: difficulty
        ? (difficulty.value as unknown as typeof SAFE_DEFAULTS.difficultyLevels)
        : SAFE_DEFAULTS.difficultyLevels,
      generationRules: generation
        ? (generation.value as unknown as typeof SAFE_DEFAULTS.generationRules)
        : SAFE_DEFAULTS.generationRules,
      validationRules: validation
        ? (validation.value as unknown as typeof SAFE_DEFAULTS.validationRules)
        : SAFE_DEFAULTS.validationRules,
      queueSettings: queue
        ? (queue.value as unknown as typeof SAFE_DEFAULTS.queueSettings)
        : SAFE_DEFAULTS.queueSettings,
      environmentFlags: envFlags
        ? (envFlags.value as unknown as typeof SAFE_DEFAULTS.environmentFlags)
        : SAFE_DEFAULTS.environmentFlags,
    };

    // Store in DB if they don't exist
    const writes: Promise<unknown>[] = [];
    if (!difficulty) {
      writes.push(
        this.configRepository.upsertConfig(
          "difficulty",
          SAFE_DEFAULTS.difficultyLevels,
        ),
      );
    }
    if (!generation) {
      writes.push(
        this.configRepository.upsertConfig(
          "generation",
          SAFE_DEFAULTS.generationRules,
        ),
      );
    }
    if (!validation) {
      writes.push(
        this.configRepository.upsertConfig(
          "validation",
          SAFE_DEFAULTS.validationRules,
        ),
      );
    }
    if (!queue) {
      writes.push(
        this.configRepository.upsertConfig(
          "queue",
          SAFE_DEFAULTS.queueSettings,
        ),
      );
    }
    if (!envFlags) {
      writes.push(
        this.configRepository.upsertConfig(
          "envFlags",
          SAFE_DEFAULTS.environmentFlags,
        ),
      );
    }
    if (writes.length > 0) {
      await Promise.all(writes);
    }

    // Validate structure schema-level
    const parsed = SystemConfigSchema.parse(mergedConfig);

    // Save back to Redis cache
    await this.cacheService.set(CACHE_KEY, parsed, { ttl: CACHE_TTL });

    // 4. formatResponse()
    return parsed as SystemConfigDto;
  }

  async updateSystemConfig(
    input: UpdateSystemConfigDto,
  ): Promise<SystemConfigDto> {
    // 1. validate() -> validate partial inputs via schema
    const validation = UpdateSystemConfigDto.validate(input);
    if (!validation.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid configuration properties",
          details: validation.error.format(),
        },
      });
    }
    const validatedInput = validation.data;

    // 2. fetchDependencies() -> load current complete configuration
    const currentConfig = await this.getSystemConfig();

    // 3. coreLogic() -> merge override logic and upsert
    let mergedDifficultyLevels = currentConfig.difficultyLevels;
    if (validatedInput.difficultyLevels) {
      mergedDifficultyLevels = currentConfig.difficultyLevels.map((lvl) => {
        const update = validatedInput.difficultyLevels?.find(
          (u) => u && u.id === lvl.id,
        );
        return update ? ({ ...lvl, ...update } as typeof lvl) : lvl;
      });
    }

    const mergedConfig: SystemConfigDto = {
      difficultyLevels: mergedDifficultyLevels,
      generationRules: {
        ...currentConfig.generationRules,
        ...validatedInput.generationRules,
      },
      validationRules: {
        ...currentConfig.validationRules,
        ...validatedInput.validationRules,
      },
      queueSettings: {
        ...currentConfig.queueSettings,
        ...validatedInput.queueSettings,
      },
      environmentFlags: {
        ...currentConfig.environmentFlags,
        ...validatedInput.environmentFlags,
      },
    };

    // Ensure entire object conforms to Schema structure
    const parsed = SystemConfigSchema.parse(mergedConfig);

    const writes: Promise<unknown>[] = [];
    if (validatedInput.difficultyLevels !== undefined) {
      writes.push(
        this.configRepository.upsertConfig(
          "difficulty",
          parsed.difficultyLevels,
        ),
      );
    }
    if (validatedInput.generationRules !== undefined) {
      writes.push(
        this.configRepository.upsertConfig(
          "generation",
          parsed.generationRules,
        ),
      );
    }
    if (validatedInput.validationRules !== undefined) {
      writes.push(
        this.configRepository.upsertConfig(
          "validation",
          parsed.validationRules,
        ),
      );
    }
    if (validatedInput.queueSettings !== undefined) {
      writes.push(
        this.configRepository.upsertConfig("queue", parsed.queueSettings),
      );
    }
    if (validatedInput.environmentFlags !== undefined) {
      writes.push(
        this.configRepository.upsertConfig("envFlags", parsed.environmentFlags),
      );
    }

    if (writes.length > 0) {
      await Promise.all(writes);
    }

    // Update Redis cache immediately
    await this.cacheService.set(CACHE_KEY, parsed, { ttl: CACHE_TTL });

    // 4. formatResponse()
    return parsed as SystemConfigDto;
  }

  async getTemplates(): Promise<Template[]> {
    // 1. validate() -> None required
    // 2. fetchDependencies() -> template repository call
    const templates = await this.templateRepository.findSystemTemplates();
    // 3. coreLogic() & 4. formatResponse()
    return templates;
  }
}

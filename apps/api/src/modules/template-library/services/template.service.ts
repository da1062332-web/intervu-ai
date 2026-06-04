import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Template, Prisma, DifficultyLevel } from '@prisma/client';
import { createHash } from 'crypto';

import { RedisCacheService } from '../../../cache';
import { TemplateRepository } from '../repositories/template.repository';
import { CreateTemplateDto, UpdateTemplateDto, TemplateVersionDto } from '@intervu/shared';

export interface PaginatedTemplates {
  items: Template[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class TemplateService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly cacheService: RedisCacheService,
  ) {}

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findAll(
    page = 1,
    limit = 10,
    difficulty?: DifficultyLevel,
  ): Promise<PaginatedTemplates> {
    // 1. validate()
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'page must be ≥ 1 and limit must be between 1 and 100' },
      });
    }

    // 2. fetchDependencies() — check cache first
    const filterHash = createHash('md5')
      .update(`p${page}l${limit}d${difficulty ?? 'all'}`)
      .digest('hex');
    const cached = await this.cacheService.getTemplateList<PaginatedTemplates>(filterHash);
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const whereClause: Record<string, unknown> = difficulty ? { difficulty } : {};
    const result = await this.templateRepository.findPaginated(
      { page, limit },
      whereClause,
      { createdAt: 'desc' },
    );

    // 4. formatResponse() — cache and return
    await this.cacheService.setTemplateList(filterHash, result);
    return result;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findById(id: string): Promise<Template> {
    // 1. validate()
    if (!id || id.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Template ID is required' },
      });
    }

    // 2. fetchDependencies() — check cache first
    const cached = await this.cacheService.getTemplate<Template>(id);
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: `Template ${id} not found` },
      });
    }

    // 4. formatResponse() — cache and return
    await this.cacheService.setTemplate(id, template);
    return template;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findByDifficulty(difficulty: DifficultyLevel): Promise<Template[]> {
    // 1. validate()
    if (!Object.values(DifficultyLevel).includes(difficulty)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid difficulty: ${difficulty}` },
      });
    }

    // 2. fetchDependencies() — check cache
    const cached = await this.cacheService.getTemplatesByDifficulty<Template[]>(difficulty);
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const templates = await this.templateRepository.findByDifficulty(difficulty);

    // 4. formatResponse() — cache and return
    await this.cacheService.setTemplatesByDifficulty(difficulty, templates);
    return templates;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async findSystemTemplates(): Promise<Template[]> {
    // 1. validate() — no input

    // 2. fetchDependencies() — check cache
    const cached = await this.cacheService.getSystemTemplates<Template[]>();
    if (cached) return cached;

    // 3. coreLogic() — fetch from DB
    const templates = await this.templateRepository.findSystemTemplates();

    // 4. formatResponse() — cache with long TTL and return
    await this.cacheService.setSystemTemplates(templates);
    return templates;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async create(dto: CreateTemplateDto): Promise<Template> {
    // 1. validate()
    const validation = CreateTemplateDto.validate(dto);
    if (!validation.success) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid template data', details: validation.error.format() },
      });
    }
    const validated = validation.data;

    // 2. fetchDependencies() — none required for create

    // 3. coreLogic() — persist to DB
    const createInput: Prisma.TemplateCreateInput = {
      name: validated.name,
      description: validated.description,
      difficulty: (validated.difficulty as DifficultyLevel) ?? DifficultyLevel.MEDIUM,
      config: validated.config as Prisma.InputJsonValue,
      isSystem: validated.isSystem ?? false,
    };
    const template = await this.templateRepository.create(createInput);

    // 4. formatResponse() — invalidate list caches, return new template
    if (template.isSystem) {
      await this.cacheService.invalidateSystemTemplates();
    } else {
      await this.cacheService.clear('template:list:*');
    }
    return template;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async update(id: string, dto: UpdateTemplateDto): Promise<Template> {
    // 1. validate()
    const validation = UpdateTemplateDto.validate(dto);
    if (!validation.success) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid update data', details: validation.error.format() },
      });
    }
    const validated = validation.data;

    // 2. fetchDependencies() — ensure template exists
    const existing = await this.templateRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: `Template ${id} not found` },
      });
    }

    // 3. coreLogic() — build update input and persist
    const updateInput: Prisma.TemplateUpdateInput = {};
    if (validated.name !== undefined) updateInput.name = validated.name;
    if (validated.description !== undefined) updateInput.description = validated.description;
    if (validated.difficulty !== undefined) updateInput.difficulty = validated.difficulty as DifficultyLevel;
    if (validated.config !== undefined) updateInput.config = validated.config as Prisma.InputJsonValue;

    const updated = await this.templateRepository.update(id, updateInput);

    // 4. formatResponse() — invalidate stale caches, return updated template
    await this.cacheService.invalidateTemplate(id);
    if (updated.isSystem) {
      await this.cacheService.invalidateSystemTemplates();
    }
    return updated;
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async remove(id: string): Promise<{ id: string }> {
    // 1. validate()
    if (!id || id.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Template ID is required' },
      });
    }

    // 2. fetchDependencies() — ensure template exists
    const existing = await this.templateRepository.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: `Template ${id} not found` },
      });
    }

    // 3. coreLogic() — soft delete
    await this.templateRepository.delete(id);

    // 4. formatResponse() — invalidate all template caches
    await this.cacheService.invalidateTemplate(id);
    if (existing.isSystem) {
      await this.cacheService.invalidateSystemTemplates();
    }
    return { id };
  }

  /**
   * Pipeline: validate → fetchDependencies → coreLogic → formatResponse
   */
  async getVersion(id: string): Promise<TemplateVersionDto> {
    // 1. validate()
    if (!id || id.trim().length === 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Template ID is required' },
      });
    }

    // 2. fetchDependencies() — reuse findById (cache-aware)
    const template = await this.findById(id);

    // 3. coreLogic() — use updatedAt as optimistic version token

    // 4. formatResponse()
    return {
      id: template.id,
      version: template.updatedAt.toISOString(),
      name: template.name,
    };
  }
}

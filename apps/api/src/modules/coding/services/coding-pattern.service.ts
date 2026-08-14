import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CodingPatternRepository } from "../repositories/coding-pattern.repository";
import { CodingOracleService } from "./coding-oracle.service";
import { CreateCodingPatternDto } from "../dto/create-coding-pattern.dto";
import { UpdateCodingPatternDto } from "../dto/update-coding-pattern.dto";
import { CodingPattern, CodingPatternStatus, DifficultyLevel } from "@prisma/client";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class CodingPatternService {
  constructor(
    private readonly patternRepo: CodingPatternRepository,
    private readonly oracleService: CodingOracleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPattern(dto: CreateCodingPatternDto, creatorId?: string): Promise<CodingPattern> {
    await this.oracleService.validateOracleForUsage(dto.oracleKey);

    const existingSlug = await this.patternRepo.findBySlug(dto.slug);
    if (existingSlug) {
      throw new ConflictException(`Coding Pattern with slug "${dto.slug}" already exists.`);
    }

    const pattern = await this.patternRepo.create({
      title: dto.title,
      slug: dto.slug,
      description: dto.description,
      difficulty: dto.difficulty ?? DifficultyLevel.MEDIUM,
      status: dto.status ?? CodingPatternStatus.DRAFT,
      version: dto.version ?? 1,
      oracleKey: dto.oracleKey,
      statementSpecification: dto.statementSpecification ?? {},
      parameterSchema: dto.parameterSchema ?? {},
      constraintSchema: dto.constraintSchema ?? {},
      aiConfiguration: dto.aiConfiguration ?? {},
      starterCode: dto.starterCode ?? {},
      metadata: dto.metadata ?? {},
      creatorId,
    });

    // Automatically trigger question generation for this pattern asynchronously
    this.eventEmitter.emit("coding_pattern.created", {
      patternId: pattern.id,
      oracleKey: pattern.oracleKey,
    });

    return pattern;
  }

  async getPatternById(id: string): Promise<CodingPattern> {
    const pattern = await this.patternRepo.findById(id);
    if (!pattern) {
      throw new NotFoundException(`Coding Pattern with ID "${id}" not found.`);
    }
    return pattern;
  }

  async getPatternBySlug(slug: string): Promise<CodingPattern> {
    const pattern = await this.patternRepo.findBySlug(slug);
    if (!pattern) {
      throw new NotFoundException(`Coding Pattern with slug "${slug}" not found.`);
    }
    return pattern;
  }

  async getAllPatterns(params?: {
    status?: CodingPatternStatus;
    difficulty?: DifficultyLevel;
    oracleKey?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: CodingPattern[]; total: number; page: number; limit: number }> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const { items, total } = await this.patternRepo.findAll({
      status: params?.status,
      difficulty: params?.difficulty,
      oracleKey: params?.oracleKey,
      search: params?.search,
      skip,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async updatePattern(id: string, dto: UpdateCodingPatternDto): Promise<CodingPattern> {
    const existing = await this.getPatternById(id);

    const targetOracleKey = dto.oracleKey || existing.oracleKey;
    const isBecomingPublished =
      dto.isPublished === true ||
      dto.status === CodingPatternStatus.PUBLISHED ||
      (dto.isPublished === undefined && dto.status === undefined && existing.status === CodingPatternStatus.PUBLISHED);

    if (isBecomingPublished || dto.oracleKey) {
      await this.oracleService.validateOracleForUsage(targetOracleKey);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugCheck = await this.patternRepo.findBySlug(dto.slug);
      if (slugCheck) {
        throw new ConflictException(`Coding Pattern with slug "${dto.slug}" already exists.`);
      }
    }

    const updateData: any = { ...dto };
    if (dto.isPublished !== undefined) {
      updateData.status = dto.isPublished ? CodingPatternStatus.PUBLISHED : CodingPatternStatus.DRAFT;
      delete updateData.isPublished;
    }

    const updated = await this.patternRepo.update(id, updateData);

    if (isBecomingPublished) {
      this.eventEmitter.emit("coding_pattern.created", {
        patternId: updated.id,
        oracleKey: updated.oracleKey,
      });
    }

    return updated;
  }

  async deletePattern(id: string): Promise<CodingPattern> {
    await this.getPatternById(id);
    return this.patternRepo.softDelete(id);
  }
}

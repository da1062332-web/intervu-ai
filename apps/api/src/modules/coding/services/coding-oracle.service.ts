import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { CodingOracleRepository } from "../repositories/coding-oracle.repository";
import { OracleRegistry } from "../oracles/oracle.registry";
import { CodingOracle } from "@prisma/client";

export interface CreateCodingOracleDto {
  key: string;
  name: string;
  category?: string;
  description?: string;
  supportedDifficulties?: string[];
  parameterSchema?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive?: boolean;
  version?: number;
}

export interface UpdateCodingOracleDto {
  name?: string;
  category?: string;
  description?: string;
  supportedDifficulties?: string[];
  parameterSchema?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive?: boolean;
  version?: number;
}

export interface CodingOracleResponseItem extends CodingOracle {
  id: string;
  key: string;
  isProviderAvailable: boolean;
  patternCount: number;
}

@Injectable()
export class CodingOracleService implements OnModuleInit {
  constructor(
    private readonly oracleRepo: CodingOracleRepository,
    private readonly oracleRegistry: OracleRegistry,
  ) {}

  async onModuleInit() {
    // Disabled automatic database sync on startup per configuration requirement
  }

  /**
   * Syncs backend TypeScript BaseOracle providers with PostgreSQL database entities.
   */
  async syncOraclesWithRegistry(): Promise<{
    syncedCount: number;
    totalCount: number;
  }> {
    const registryMetadata = this.oracleRegistry.getAllMetadata();
    let syncedCount = 0;

    for (const meta of registryMetadata) {
      await this.oracleRepo.upsertByKey(meta.key, {
        name: meta.name,
        category: meta.category,
        description: meta.description,
        supportedDifficulties: meta.supportedDifficulties,
        parameterSchema: meta.parameterSchema,
      });
      syncedCount++;
    }

    const { total } = await this.oracleRepo.findAll();
    return { syncedCount, totalCount: total };
  }

  async getAllOracles(params?: {
    category?: string;
    isActive?: boolean;
    isSystem?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: CodingOracleResponseItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 50;
    const skip = (page - 1) * limit;

    const { items, total } = await this.oracleRepo.findAll({
      category: params?.category,
      isActive: params?.isActive,
      isSystem: params?.isSystem,
      search: params?.search,
      skip,
      take: limit,
    });

    const enrichedItems: CodingOracleResponseItem[] = items.map((oracle) => ({
      ...oracle,
      isProviderAvailable: this.oracleRegistry.hasOracle(oracle.key),
      patternCount: oracle._count?.patterns || 0,
    }));

    return { items: enrichedItems, total, page, limit };
  }

  async getOracleByIdOrKey(idOrKey: string): Promise<CodingOracleResponseItem> {
    let oracle = await this.oracleRepo.findById(idOrKey);
    if (!oracle) {
      oracle = await this.oracleRepo.findByKey(idOrKey);
    }
    if (!oracle) {
      throw new NotFoundException(`Coding Oracle "${idOrKey}" not found.`);
    }

    return {
      ...oracle,
      isProviderAvailable: this.oracleRegistry.hasOracle(oracle.key),
      patternCount: oracle._count?.patterns || 0,
    };
  }

  async createOracle(
    dto: CreateCodingOracleDto,
    creatorId?: string,
  ): Promise<CodingOracleResponseItem> {
    const existing = await this.oracleRepo.findByKey(dto.key);
    if (existing) {
      throw new ConflictException(
        `Coding Oracle with key "${dto.key}" already exists.`,
      );
    }

    const created = await this.oracleRepo.create({
      key: dto.key,
      name: dto.name,
      category: dto.category || "GENERAL",
      description: dto.description,
      supportedDifficulties: dto.supportedDifficulties || [
        "EASY",
        "MEDIUM",
        "HARD",
      ],
      parameterSchema: dto.parameterSchema || {},
      metadata: dto.metadata || {},
      isActive: dto.isActive ?? true,
      isSystem: false,
      version: dto.version ?? 1,
      creatorId,
    });

    return {
      ...created,
      isProviderAvailable: this.oracleRegistry.hasOracle(created.key),
      patternCount: 0,
    };
  }

  async updateOracle(
    idOrKey: string,
    dto: UpdateCodingOracleDto,
  ): Promise<CodingOracleResponseItem> {
    const existing = await this.getOracleByIdOrKey(idOrKey);

    const updated = await this.oracleRepo.update(existing.id, {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.category ? { category: dto.category } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.supportedDifficulties
        ? { supportedDifficulties: dto.supportedDifficulties }
        : {}),
      ...(dto.parameterSchema ? { parameterSchema: dto.parameterSchema } : {}),
      ...(dto.metadata ? { metadata: dto.metadata } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      version: dto.version ?? existing.version + 1,
    });

    return {
      ...updated,
      isProviderAvailable: this.oracleRegistry.hasOracle(updated.key),
      patternCount: existing.patternCount,
    };
  }

  async toggleOracleStatus(idOrKey: string): Promise<CodingOracleResponseItem> {
    const existing = await this.getOracleByIdOrKey(idOrKey);
    const updated = await this.oracleRepo.toggleStatus(existing.id);

    return {
      ...updated,
      isProviderAvailable: this.oracleRegistry.hasOracle(updated.key),
      patternCount: existing.patternCount,
    };
  }

  /**
   * Validates if an Oracle key is active in DB and has an available backend provider.
   */
  async validateOracleForUsage(oracleKey: string): Promise<void> {
    const oracle = await this.oracleRepo.findByKey(oracleKey);
    if (!oracle) {
      throw new BadRequestException(
        `Oracle key "${oracleKey}" does not exist in the database.`,
      );
    }

    if (!oracle.isActive) {
      throw new BadRequestException(
        `Oracle "${oracle.name}" (${oracleKey}) is currently set to INACTIVE by admin.`,
      );
    }

    if (!this.oracleRegistry.hasOracle(oracleKey)) {
      throw new BadRequestException(
        `Oracle "${oracle.name}" (${oracleKey}) is active in database, but its backend executable implementation provider is not registered.`,
      );
    }
  }
}

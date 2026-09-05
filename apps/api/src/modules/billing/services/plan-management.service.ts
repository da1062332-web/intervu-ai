import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreatePlanDto,
  UpdatePlanDto,
  CreatePlanFeatureDto,
  UpdatePlanFeatureDto,
} from "@intervu-ai/contracts";

@Injectable()
export class PlanManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all plans with features (for Plan Manager / Admin)
   */
  private static adminPlansCache: { data: any; expiresAt: number } | null = null;
  private static publicPlansCache: { data: any; expiresAt: number } | null = null;

  static invalidateAllPlansCaches() {
    PlanManagementService.publicPlansCache = null;
    PlanManagementService.adminPlansCache = null;
  }

  static invalidatePublicPlansCache() {
    PlanManagementService.invalidateAllPlansCaches();
  }

  /**
   * Get all plans with features (for Plan Manager / Admin)
   */
  async getAllPlans(includeInactive = true) {
    const now = Date.now();
    if (
      includeInactive &&
      PlanManagementService.adminPlansCache &&
      PlanManagementService.adminPlansCache.expiresAt > now
    ) {
      return PlanManagementService.adminPlansCache.data;
    }

    const where = includeInactive ? {} : { isActive: true };
    const data = await this.prisma.plan.findMany({
      where,
      include: {
        features: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (includeInactive) {
      PlanManagementService.adminPlansCache = {
        data,
        expiresAt: now + 60 * 1000, // 1 min in-memory cache
      };
    }

    return data;
  }

  /**
   * Get active public plans (for Candidate Pricing Modal & Dashboard)
   */
  async getPublicPlans() {
    const now = Date.now();
    if (
      PlanManagementService.publicPlansCache &&
      PlanManagementService.publicPlansCache.expiresAt > now
    ) {
      return PlanManagementService.publicPlansCache.data;
    }

    const data = await this.prisma.plan.findMany({
      where: { isActive: true },
      include: {
        features: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    PlanManagementService.publicPlansCache = {
      data,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes in-memory cache
    };
    return data;
  }

  /**
   * Get a plan by its unique slug
   */
  async getPlanBySlug(slug: string) {
    return this.prisma.plan.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      include: {
        features: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  /**
   * Resolve the canonical, admin-configured price for a plan slug.
   * This is the single source of truth for how much a plan costs -
   * callers must never accept a client-supplied amount instead.
   */
  async resolvePlanPricing(slug: string): Promise<{ plan: any; amount: number }> {
    const dbPlan = await this.getPlanBySlug(String(slug || "").toLowerCase().trim());

    if (!dbPlan || !dbPlan.isActive) {
      throw new BadRequestException(
        `Plan '${slug}' is not currently available. Please contact support.`,
      );
    }

    if (typeof dbPlan.priceMonthly !== "number" || dbPlan.priceMonthly < 100) {
      throw new BadRequestException(
        `Plan '${slug}' does not have a valid price configured. Please contact support.`,
      );
    }

    return { plan: dbPlan, amount: dbPlan.priceMonthly };
  }

  /**
   * Get all active assessment configurations available for assignment
   */
  async getAvailableAssessments() {
    const [exams, testConfigs] = await Promise.all([
      this.prisma.examConfig.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          name: true,
          role: true,
          code: true,
          durationMinutes: true,
          totalQuestions: true,
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.testConfig.findMany({
        where: { isActive: true },
        select: {
          id: true,
          displayName: true,
          configKey: true,
          totalDurationSeconds: true,
          totalQuestions: true,
        },
        orderBy: { displayName: "asc" },
      }),
    ]);

    const examList = exams.map((e: any) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      code: e.code,
      durationMinutes: e.durationMinutes,
      totalQuestions: e.totalQuestions,
    }));

    const configList = testConfigs
      .filter((tc: any) => !exams.some((e: any) => e.code === tc.configKey || e.id === tc.id))
      .map((tc: any) => ({
        id: tc.id,
        name: tc.displayName,
        role: 'Standard Assessment',
        code: tc.configKey,
        durationMinutes: Math.round((tc.totalDurationSeconds || 0) / 60),
        totalQuestions: tc.totalQuestions,
      }));

    return [...examList, ...configList];
  }

  /**
   * Create a new Plan
   */
  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.plan.findUnique({
      where: { slug: dto.slug.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException(`Plan with slug '${dto.slug}' already exists`);
    }

    const { features, ...planData } = dto;

    const result = await this.prisma.plan.create({
      data: {
        ...planData,
        slug: dto.slug.toLowerCase().trim(),
        features: features && features.length > 0 ? {
          create: features.map((f, idx) => ({
            featureKey: f.featureKey,
            featureName: f.featureName,
            valueType: f.valueType,
            valueJson: f.valueJson,
            description: f.description,
            sortOrder: f.sortOrder ?? idx,
          })),
        } : undefined,
      },
      include: {
        features: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    PlanManagementService.invalidatePublicPlansCache();
    return result;
  }

  /**
   * Update an existing Plan
   */
  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID '${id}' not found`);
    }

    const { features, ...updateData } = dto;

    const result = await this.prisma.plan.update({
      where: { id },
      data: {
        ...updateData,
        slug: updateData.slug ? updateData.slug.toLowerCase().trim() : undefined,
      },
      include: {
        features: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    PlanManagementService.invalidatePublicPlansCache();
    return result;
  }

  /**
   * Delete / Archive a Plan
   */
  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID '${id}' not found`);
    }

    const result = await this.prisma.plan.delete({
      where: { id },
    });
    PlanManagementService.invalidatePublicPlansCache();
    return result;
  }

  /**
   * Add a Feature / Limitation to a Plan
   */
  async addFeature(planId: string, dto: CreatePlanFeatureDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID '${planId}' not found`);
    }

    const result = await this.prisma.planFeature.upsert({
      where: {
        planId_featureKey: {
          planId,
          featureKey: dto.featureKey,
        },
      },
      update: {
        featureName: dto.featureName,
        valueType: dto.valueType,
        valueJson: dto.valueJson,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
      create: {
        planId,
        featureKey: dto.featureKey,
        featureName: dto.featureName,
        valueType: dto.valueType,
        valueJson: dto.valueJson,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    PlanManagementService.invalidatePublicPlansCache();
    return result;
  }

  /**
   * Update an existing feature / limitation rule
   */
  async updateFeature(planId: string, featureId: string, dto: UpdatePlanFeatureDto) {
    const feature = await this.prisma.planFeature.findFirst({
      where: { id: featureId, planId },
    });

    if (!feature) {
      throw new NotFoundException(`Feature limitation with ID '${featureId}' not found on plan`);
    }

    const result = await this.prisma.planFeature.update({
      where: { id: featureId },
      data: dto,
    });
    PlanManagementService.invalidatePublicPlansCache();
    return result;
  }

  /**
   * Delete a feature limitation from a plan
   */
  async deleteFeature(planId: string, featureId: string) {
    const feature = await this.prisma.planFeature.findFirst({
      where: { id: featureId, planId },
    });

    if (!feature) {
      throw new NotFoundException(`Feature limitation with ID '${featureId}' not found on plan`);
    }

    const result = await this.prisma.planFeature.delete({
      where: { id: featureId },
    });
    PlanManagementService.invalidatePublicPlansCache();
    return result;
  }
}

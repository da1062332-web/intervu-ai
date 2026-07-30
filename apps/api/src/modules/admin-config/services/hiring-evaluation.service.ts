import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { HiringEvaluationConfigDto } from "@intervu-ai/contracts";
import { HiringStrategyType, HiringMappingType } from "@intervu-ai/database";

@Injectable()
export class HiringEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(examConfigId: string): Promise<HiringEvaluationConfigDto> {
    const config = await this.prisma.hiringEvaluationConfig.findUnique({
      where: { examConfigId },
      include: { sectionMappings: true },
    });

    if (!config) {
      return {
        examConfigId,
        strategy: "TCS",
        enabled: false,
        ninjaThreshold: 0,
        digitalThreshold: 0,
        primeThreshold: 0,
        advancedDigitalMin: 0,
        advancedPrimeMin: 0,
        codingTotalProblems: 0,
        codingDigitalMinSolved: 0,
        codingPrimeMinSolved: 0,
        sectionMappings: [],
      };
    }

    return {
      id: config.id,
      examConfigId: config.examConfigId,
      strategy: config.strategy as any,
      enabled: config.enabled,
      ninjaThreshold: config.ninjaThreshold,
      digitalThreshold: config.digitalThreshold,
      primeThreshold: config.primeThreshold,
      advancedDigitalMin: config.advancedDigitalMin,
      advancedPrimeMin: config.advancedPrimeMin,
      codingTotalProblems: config.codingTotalProblems,
      codingDigitalMinSolved: config.codingDigitalMinSolved,
      codingPrimeMinSolved: config.codingPrimeMinSolved,
      sectionMappings: config.sectionMappings.map((m: any) => ({
        id: m.id,
        sectionCode: m.sectionCode,
        sectionName: m.sectionName || undefined,
        mappingType: m.mappingType as any,
        minimumCorrectAnswers: m.minimumCorrectAnswers,
      })),
    };
  }

  async upsertConfig(
    examConfigId: string,
    dto: Partial<HiringEvaluationConfigDto>,
  ): Promise<HiringEvaluationConfigDto> {
    const examConfig = await this.prisma.examConfig.findUnique({
      where: { id: examConfigId },
    });
    if (!examConfig) {
      throw new NotFoundException(
        `Exam config with ID '${examConfigId}' not found`,
      );
    }

    const strategyEnum = (dto.strategy || "TCS") as HiringStrategyType;

    const savedConfig = await this.prisma.$transaction(async (tx: any) => {
      // 1. Upsert HiringEvaluationConfig
      const config = await tx.hiringEvaluationConfig.upsert({
        where: { examConfigId },
        update: {
          strategy: strategyEnum,
          enabled: dto.enabled ?? false,
          ninjaThreshold: dto.ninjaThreshold ?? 0,
          digitalThreshold: dto.digitalThreshold ?? 0,
          primeThreshold: dto.primeThreshold ?? 0,
          advancedDigitalMin: dto.advancedDigitalMin ?? 0,
          advancedPrimeMin: dto.advancedPrimeMin ?? 0,
          codingTotalProblems: dto.codingTotalProblems ?? 0,
          codingDigitalMinSolved: dto.codingDigitalMinSolved ?? 0,
          codingPrimeMinSolved: dto.codingPrimeMinSolved ?? 0,
        },
        create: {
          examConfigId,
          strategy: strategyEnum,
          enabled: dto.enabled ?? false,
          ninjaThreshold: dto.ninjaThreshold ?? 0,
          digitalThreshold: dto.digitalThreshold ?? 0,
          primeThreshold: dto.primeThreshold ?? 0,
          advancedDigitalMin: dto.advancedDigitalMin ?? 0,
          advancedPrimeMin: dto.advancedPrimeMin ?? 0,
          codingTotalProblems: dto.codingTotalProblems ?? 0,
          codingDigitalMinSolved: dto.codingDigitalMinSolved ?? 0,
          codingPrimeMinSolved: dto.codingPrimeMinSolved ?? 0,
        },
      });

      // 2. Clear old section mappings and recreate if provided
      if (dto.sectionMappings) {
        await tx.hiringSectionMapping.deleteMany({
          where: { configId: config.id },
        });

        if (dto.sectionMappings.length > 0) {
          await tx.hiringSectionMapping.createMany({
            data: dto.sectionMappings.map((m: any) => ({
              configId: config.id,
              sectionCode: m.sectionCode,
              sectionName: m.sectionName || null,
              mappingType: m.mappingType as HiringMappingType,
              minimumCorrectAnswers: m.minimumCorrectAnswers || 0,
            })),
          });
        }
      }

      return tx.hiringEvaluationConfig.findUnique({
        where: { id: config.id },
        include: { sectionMappings: true },
      });
    });

    if (!savedConfig) {
      throw new Error("Failed to save hiring evaluation config");
    }

    return {
      id: savedConfig.id,
      examConfigId: savedConfig.examConfigId,
      strategy: savedConfig.strategy as any,
      enabled: savedConfig.enabled,
      ninjaThreshold: savedConfig.ninjaThreshold,
      digitalThreshold: savedConfig.digitalThreshold,
      primeThreshold: savedConfig.primeThreshold,
      advancedDigitalMin: savedConfig.advancedDigitalMin,
      advancedPrimeMin: savedConfig.advancedPrimeMin,
      codingTotalProblems: savedConfig.codingTotalProblems,
      codingDigitalMinSolved: savedConfig.codingDigitalMinSolved,
      codingPrimeMinSolved: savedConfig.codingPrimeMinSolved,
      sectionMappings: savedConfig.sectionMappings.map((m: any) => ({
        id: m.id,
        sectionCode: m.sectionCode,
        sectionName: m.sectionName || undefined,
        mappingType: m.mappingType as any,
        minimumCorrectAnswers: m.minimumCorrectAnswers,
      })),
    };
  }

  async getAllSavedStrategies() {
    const configs = await this.prisma.hiringEvaluationConfig.findMany({
      include: { sectionMappings: true },
      orderBy: { updatedAt: "desc" },
    });

    const strategyMap = new Map<string, any>();

    // Built-in TCS default preset
    strategyMap.set("TCS", {
      strategy: "TCS",
      name: "TCS Hiring Evaluation Strategy",
      ninjaThreshold: 15,
      digitalThreshold: 25,
      primeThreshold: 35,
      advancedDigitalMin: 8,
      advancedPrimeMin: 12,
      codingTotalProblems: 2,
      codingDigitalMinSolved: 1,
      codingPrimeMinSolved: 2,
      numericalMin: 5,
      verbalMin: 5,
      reasoningMin: 5,
    });

    for (const cfg of configs) {
      if (cfg.strategy && !strategyMap.has(cfg.strategy)) {
        const numMapping = cfg.sectionMappings.find(
          (m: any) => m.mappingType === "NUMERICAL",
        );
        const verbMapping = cfg.sectionMappings.find(
          (m: any) => m.mappingType === "VERBAL",
        );
        const reasMapping = cfg.sectionMappings.find(
          (m: any) => m.mappingType === "REASONING",
        );

        strategyMap.set(cfg.strategy, {
          strategy: cfg.strategy,
          name:
            cfg.strategy === "TCS"
              ? "TCS Hiring Evaluation Strategy"
              : cfg.strategy,
          ninjaThreshold: cfg.ninjaThreshold,
          digitalThreshold: cfg.digitalThreshold,
          primeThreshold: cfg.primeThreshold,
          advancedDigitalMin: cfg.advancedDigitalMin,
          advancedPrimeMin: cfg.advancedPrimeMin,
          codingTotalProblems: cfg.codingTotalProblems,
          codingDigitalMinSolved: cfg.codingDigitalMinSolved,
          codingPrimeMinSolved: cfg.codingPrimeMinSolved,
          numericalMin: numMapping?.minimumCorrectAnswers ?? 5,
          verbalMin: verbMapping?.minimumCorrectAnswers ?? 5,
          reasoningMin: reasMapping?.minimumCorrectAnswers ?? 5,
        });
      }
    }

    return Array.from(strategyMap.values());
  }
}

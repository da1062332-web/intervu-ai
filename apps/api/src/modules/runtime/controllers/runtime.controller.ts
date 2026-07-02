import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { RuntimeGeneratorService } from "../services/runtime-generator.service";
import { LaunchPrecheckService } from "../services/launch-precheck.service";
import { RuntimeValidationService } from "../validation/runtime-validation.service";
import { RuntimeGuard } from "../guards/runtime.guard";
import { TestPackageService } from "../../assembly/services/test-package.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { RuntimeMapperService } from "../services/runtime-mapper.service";

@Controller("runtime")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RuntimeController {
  constructor(
    private readonly generatorService: RuntimeGeneratorService,
    private readonly precheckService: LaunchPrecheckService,
    private readonly validationService: RuntimeValidationService,
    private readonly packageService: TestPackageService,
    private readonly prisma: PrismaService,
    private readonly mapperService: RuntimeMapperService,
  ) {}

  @Get("test/:testId")
  @UseGuards(RuntimeGuard)
  async getRuntime(@Param("testId") testId: string) {
    const packagedTest = await this.packageService.generatePackage(testId);
    const runtimeTest =
      await this.generatorService.generateRuntime(packagedTest);
    return { runtimeTest };
  }

  @Get("test/:testId/section/:sectionId")
  @UseGuards(RuntimeGuard)
  async getSection(
    @Param("testId") testId: string,
    @Param("sectionId") sectionId: string,
  ) {
    const packagedTest = await this.packageService.generatePackage(testId);
    const runtimeTest =
      await this.generatorService.generateRuntime(packagedTest);
    const section = runtimeTest.sections.find((s) => s.sectionId === sectionId);
    if (!section) {
      throw new NotFoundException("Section not found");
    }
    return { section };
  }

  @Get("question/:questionId")
  async getQuestion(@Param("questionId") questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException("Question not found");
    }
    return {
      question: {
        questionId: question.id,
        questionText: question.questionText,
        questionType: (question.metadata as any)?.questionType || "unknown",
        metadata: question.metadata,
      },
      options: (question.metadata as any)?.options || [],
    };
  }

  @Post("validate")
  async validateRuntime(@Body("testId") testId: string) {
    const packagedTest = await this.packageService.generatePackage(testId);
    const runtimeTest = this.mapperService.mapPackageToRuntime(packagedTest);
    const validationResult = this.validationService.validate(runtimeTest);

    return {
      valid: validationResult.valid,
      errors: validationResult.errors || [],
    };
  }

  @Post("precheck")
  async runPrecheck(@Body("testId") testId: string) {
    return await this.precheckService.precheck(testId);
  }

  @Get("metrics")
  async getMetrics() {
    const builds = await this.prisma.runtimeBuild.count();
    const successful = await this.prisma.runtimeBuild.count({
      where: { status: "COMPLETED" },
    });
    const failed = await this.prisma.runtimeBuild.count({
      where: { status: "FAILED" },
    });

    const genMetrics = await this.prisma.runtimeMetric.aggregate({
      _avg: { metricValue: true },
      where: { metricName: "generation_time" },
    });

    const loadMetrics = await this.prisma.runtimeMetric.aggregate({
      _avg: { metricValue: true },
      where: { metricName: "load_time" },
    });

    const validationFailures = await this.prisma.runtimeValidationLog.count({
      where: { isValid: false },
    });

    return {
      runtimeBuilds: builds,
      successfulBuilds: successful,
      failedBuilds: failed,
      launchRequests: 0,
      validationFailures,
      averageGenerationTime: genMetrics._avg.metricValue || 0,
      averageLoadTime: loadMetrics._avg.metricValue || 0,
    };
  }

  @Get("builds")
  async getBuilds() {
    // Triggering hot reload to ensure errors are selected
    const builds = await this.prisma.runtimeBuild.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        testId: true,
        status: true,
        durationMs: true,
        createdAt: true,
        errors: true,
      },
    });
    return { builds };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SolutionTemplateRepository } from "../repositories/solution-template.repository";
import { TemplatePreviewRepository } from "../repositories/template-preview.repository";
import { TemplateRepository } from "../repositories/template.repository";
import { TemplateRendererService } from "./template-renderer.service";
import { PlaceholderValidatorService } from "./placeholder-validator.service";
import {
  CreateSolutionTemplateRequest,
  UpdateSolutionTemplateRequest,
  GenerateTemplatePreviewRequest,
} from "@intervu/shared";

@Injectable()
export class SolutionTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solutionTemplateRepo: SolutionTemplateRepository,
    private readonly templatePreviewRepo: TemplatePreviewRepository,
    private readonly templateRepo: TemplateRepository,
    private readonly renderer: TemplateRendererService,
    private readonly validator: PlaceholderValidatorService,
  ) {}

  async createSolutionTemplate(
    templateId: string,
    dto: CreateSolutionTemplateRequest,
  ) {
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundException("Template not found");
    }

    const existing =
      await this.solutionTemplateRepo.findByTemplateId(templateId);
    if (existing) {
      throw new BadRequestException(
        "Solution template already exists for this template",
      );
    }

    return this.solutionTemplateRepo.create({
      solutionTemplate: dto.solutionTemplate,
      explanationTemplate: dto.explanationTemplate,
      template: { connect: { id: templateId } },
    });
  }

  async getSolutionTemplate(templateId: string) {
    const solution =
      await this.solutionTemplateRepo.findByTemplateId(templateId);
    if (!solution) {
      throw new NotFoundException("Solution template not found");
    }
    return solution;
  }

  async updateSolutionTemplate(
    templateId: string,
    dto: UpdateSolutionTemplateRequest,
  ) {
    const existing =
      await this.solutionTemplateRepo.findByTemplateId(templateId);
    if (!existing) {
      throw new NotFoundException("Solution template not found");
    }

    return this.solutionTemplateRepo.update(existing.id, {
      solutionTemplate: dto.solutionTemplate,
      explanationTemplate: dto.explanationTemplate,
    });
  }

  async generatePreview(
    templateId: string,
    dto: GenerateTemplatePreviewRequest,
  ) {
    const solutionTemplate =
      await this.solutionTemplateRepo.findByTemplateId(templateId);
    if (!solutionTemplate) {
      throw new NotFoundException("Solution template not found");
    }

    // Fetch allowed variables (template variables)
    const variables = await this.prisma.templateVariable.findMany({
      where: { templateId },
      select: { variableName: true },
    });
    const allowedVariables = variables.map((v) => v.variableName);

    // Validate placeholders in solution
    const validation = this.validator.validate(
      solutionTemplate.solutionTemplate,
      allowedVariables,
    );

    // Also validate explanation if present
    if (solutionTemplate.explanationTemplate) {
      const explanationValidation = this.validator.validate(
        solutionTemplate.explanationTemplate,
        allowedVariables,
      );
      if (!explanationValidation.valid) {
        validation.valid = false;
        validation.unknownVariables = [
          ...new Set([
            ...validation.unknownVariables,
            ...explanationValidation.unknownVariables,
          ]),
        ];
      }
    }

    if (!validation.valid) {
      throw new BadRequestException({
        message: "Template contains unknown variables",
        unknownVariables: validation.unknownVariables,
      });
    }

    // Render outputs
    const solutionResult = this.renderer.render(
      solutionTemplate.solutionTemplate,
      dto.previewPayload,
    );
    let explanationResult: {
      renderedOutput: string | null;
      resolvedVariables: Record<string, unknown>;
    } = { renderedOutput: null, resolvedVariables: {} };
    if (solutionTemplate.explanationTemplate) {
      explanationResult = this.renderer.render(
        solutionTemplate.explanationTemplate,
        dto.previewPayload,
      );
    }

    const previewResult = {
      solution: solutionResult.renderedOutput,
      explanation: explanationResult.renderedOutput,
      resolvedVariables: {
        ...solutionResult.resolvedVariables,
        ...explanationResult.resolvedVariables,
      },
      validation,
    } as any;

    // Store preview
    const preview = await this.templatePreviewRepo.create({
      previewPayload: dto.previewPayload as any,
      previewResult,
      template: { connect: { id: templateId } },
    });

    return preview;
  }

  async getLatestPreview(templateId: string) {
    const preview =
      await this.templatePreviewRepo.findLatestPreview(templateId);
    if (!preview) {
      throw new NotFoundException("No preview found for this template");
    }
    return preview;
  }
}

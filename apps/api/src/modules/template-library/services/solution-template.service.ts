import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { GenerationRetryService } from "../../generation-ai/retry/generation-retry.service";
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
    @Inject(forwardRef(() => GenerationRetryService))
    private readonly retryService: GenerationRetryService,
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
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundException("Template not found");
    }

    // Run preview generation through the AI Question Generation Pipeline
    const result = await this.retryService.generateFromTemplate(
      template,
      dto.previewPayload,
      3,
    );

    if (!result.success || !result.question) {
      throw new BadRequestException({
        message: "AI Generation failed during preview generation",
        errors: result.errors,
      });
    }

    const question = result.question;
    const optionsText = question.options && question.options.length > 0
      ? `\n\nOptions:\n${question.options.map((o, idx) => `${String.fromCharCode(65 + idx)}) ${o}`).join("\n")}`
      : "";

    const solutionText = `Question:\n${question.question}${optionsText}\n\nCorrect Answer: ${question.correctAnswer}\n\nExplanation:\n${question.explanation}`;

    const previewResult = {
      solution: solutionText,
      explanation: question.explanation,
      resolvedVariables: dto.previewPayload,
      validation: {
        valid: true,
        unknownVariables: [],
      },
      questionText: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
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
    return preview;
  }
}

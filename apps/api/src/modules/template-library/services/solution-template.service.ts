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
import { PreviewGenerationException } from "../../../core/exceptions";
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
      const template = await this.templateRepo.findById(templateId);
      if (!template) {
        throw new NotFoundException("Template not found");
      }

      return this.solutionTemplateRepo.create({
        solutionTemplate: dto.solutionTemplate ?? "",
        explanationTemplate: dto.explanationTemplate,
        template: { connect: { id: templateId } },
      });
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

    const options: any = {};
    if (template.generationStrategy === "DATASET") {
      const config = await this.prisma.templateDatasetConfig.findUnique({
        where: { templateId: template.id },
      });
      if (!config) {
        throw new BadRequestException("Dataset configuration not found for this template");
      }

      // Fetch a dataset item
      const whereConditions: any = { datasetId: config.datasetId };
      if (config.difficultyOverride) {
        whereConditions.difficulty = config.difficultyOverride;
      }
      if (config.topicOverride) {
        whereConditions.topic = config.topicOverride;
      }
      if (config.tags && config.tags.length > 0) {
        whereConditions.tags = { hasSome: config.tags };
      }

      let items = await this.prisma.datasetItem.findMany({
        where: whereConditions,
        take: 20,
      });

      if (items.length === 0) {
        // Fallback to any items in the dataset
        items = await this.prisma.datasetItem.findMany({
          where: { datasetId: config.datasetId },
          take: 20,
        });
      }

      if (items.length === 0) {
        throw new BadRequestException(`No items found in selected dataset: ${config.datasetId}`);
      }

      const item = items[Math.floor(Math.random() * items.length)];
      options.datasetItem = {
        content: item.content,
        questionText: item.questionText || undefined,
        options: item.options || [],
        answer: item.answer || undefined,
        explanation: item.explanation || undefined,
        metadata: item.metadata || {},
      };
    }

    // Run preview generation through the AI Question Generation Pipeline
    const result = await this.retryService.generateFromTemplate(
      template,
      dto.previewPayload || {},
      3,
      options,
    );

    if (!result.success || !result.question) {
      const lastError =
        Array.isArray(result.errors) && result.errors.length > 0
          ? result.errors[result.errors.length - 1]
          : "Preview generation failed.";

      throw new PreviewGenerationException("Preview generation failed.", {
        category: "AI_SERVICE_ERROR",
        retryable: true,
        source: "generation-retry",
        reason: lastError,
      });
    }

    const question = result.question;
    const optionsText =
      question.options && question.options.length > 0
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

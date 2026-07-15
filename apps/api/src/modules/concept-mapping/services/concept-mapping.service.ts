import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ConceptMappingRepository } from "../repositories/concept-mapping.repository";
import { TopicRegistryLoader } from "./topic-registry-loader.service";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateConceptMappingDto,
  UpdateConceptMappingDto,
} from "@intervu/shared";
import { ConceptStatus } from "@prisma/client";

@Injectable()
export class ConceptMappingService {
  constructor(
    private readonly repository: ConceptMappingRepository,
    private readonly topicRegistryLoader: TopicRegistryLoader,
    private readonly prisma: PrismaService,
  ) {}

  async createConcept(topicId: string, dto: CreateConceptMappingDto) {
    // Validate that topic exists in registry
    const topic = await this.topicRegistryLoader.getTopicById(topicId);
    if (!topic) {
      throw new BadRequestException(
        `Topic ID "${topicId}" does not exist in the Topic Registry`,
      );
    }

    const codeUpper = (dto.code || dto.conceptCode).toUpperCase();
    const existing = await this.repository.findByTopicAndCode(
      topicId,
      codeUpper,
    );
    if (existing) {
      throw new ConflictException(
        `Concept code ${codeUpper} already exists for topic ${topicId}`,
      );
    }

    const name = dto.name || dto.conceptName;

    const createData = {
      name,
      code: codeUpper,
      description: dto.description,
      status: (dto.status as ConceptStatus) || ConceptStatus.ACTIVE,
      topicId,
    };

    return this.repository.create(createData);
  }

  async getConcepts(topicId: string, activeOnly = true) {
    const topic = await this.topicRegistryLoader.getTopicById(topicId);
    if (!topic) {
      throw new BadRequestException(
        `Topic ID "${topicId}" does not exist in the Topic Registry`,
      );
    }
    return this.repository.findManyByTopicId(topicId, activeOnly);
  }

  async updateConcept(conceptId: string, dto: UpdateConceptMappingDto) {
    const concept = await this.repository.findById(conceptId);
    if (!concept) {
      throw new NotFoundException(`Concept with ID ${conceptId} not found`);
    }

    const code = dto.code || dto.conceptCode;
    if (code !== undefined) {
      const codeUpper = code.toUpperCase();
      if (codeUpper !== concept.code) {
        const existing = await this.repository.findByTopicAndCode(
          concept.topicId,
          codeUpper,
        );
        if (existing && existing.id !== conceptId) {
          throw new ConflictException(
            `Concept code ${codeUpper} already exists for topic ${concept.topicId}`,
          );
        }
      }
    }

    const name = dto.name || dto.conceptName;

    return this.repository.update(conceptId, {
      name,
      code: code ? code.toUpperCase() : undefined,
      description: dto.description,
      status: dto.status as ConceptStatus,
    });
  }

  async deleteConcept(conceptId: string) {
    const concept = await this.repository.findById(conceptId);
    if (!concept) {
      throw new NotFoundException(`Concept with ID ${conceptId} not found`);
    }

    // 1. Check if any templates are currently active/exist under this concept
    const linkedTemplates = await this.prisma.template.findMany({
      where: {
        conceptKey: concept.code,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (linkedTemplates.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "CONCEPT_LINKED_TO_TEMPLATES",
          message: `Cannot deactivate concept "${concept.name}" because it is linked to ${linkedTemplates.length} template(s).`,
          details: linkedTemplates.map((t) => ({ id: t.id, name: t.name })),
        },
      });
    }

    // 2. Check if any generated questions exist under this concept key
    const linkedQuestions = await this.prisma.generatedQuestion.findMany({
      where: {
        conceptKey: concept.code,
      },
      take: 1,
    });

    if (linkedQuestions.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "CONCEPT_LINKED_TO_QUESTIONS",
          message: `Cannot deactivate concept "${concept.name}" because it has generated questions associated with it.`,
        },
      });
    }

    return this.repository.delete(conceptId);
  }

  async getAllTopics() {
    return this.topicRegistryLoader.getAllTopics();
  }

  async assignTemplates(conceptId: string, templateIds: string[]) {
    try {
      return await this.repository.assignTemplates(conceptId, templateIds);
    } catch (e: any) {
      if (e.message.includes("not found")) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }
}

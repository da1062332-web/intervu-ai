import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ConceptMappingRepository } from "../repositories/concept-mapping.repository";
import { TopicRegistryLoader } from "./topic-registry-loader.service";
import {
  CreateConceptMappingDto,
  UpdateConceptMappingDto,
} from "@intervu/shared";

@Injectable()
export class ConceptMappingService {
  constructor(
    private readonly repository: ConceptMappingRepository,
    private readonly topicRegistryLoader: TopicRegistryLoader,
  ) {}

  async createConcept(topicId: string, dto: CreateConceptMappingDto) {
    // Validate that topic exists in registry
    const topic = await this.topicRegistryLoader.getTopicById(topicId);
    if (!topic) {
      throw new BadRequestException(
        `Topic ID "${topicId}" does not exist in the Topic Registry`,
      );
    }

    const existing = await this.repository.findByTopicAndCode(
      topicId,
      dto.conceptCode,
    );
    if (existing) {
      throw new ConflictException(
        `Concept code ${dto.conceptCode} already exists for topic ${topicId}`,
      );
    }

    const createData = {
      conceptName: dto.conceptName,
      conceptCode: dto.conceptCode,
      description: dto.description,
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

    if (
      dto.conceptCode !== undefined &&
      dto.conceptCode !== concept.conceptCode
    ) {
      const existing = await this.repository.findByTopicAndCode(
        concept.topicId,
        dto.conceptCode,
      );
      if (existing && existing.id !== conceptId) {
        throw new ConflictException(
          `Concept code ${dto.conceptCode} already exists for topic ${concept.topicId}`,
        );
      }
    }

    return this.repository.update(conceptId, dto);
  }

  async deleteConcept(conceptId: string) {
    const concept = await this.repository.findById(conceptId);
    if (!concept) {
      throw new NotFoundException(`Concept with ID ${conceptId} not found`);
    }

    return this.repository.delete(conceptId);
  }
}

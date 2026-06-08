import { Injectable, Logger } from '@nestjs/common';
import { 
  GeneratedQuestionRepository, 
  generateQuestionHash, 
  HashQuestionParams,
  Prisma,
  GeneratedQuestion
} from '@intervu-ai/database';

@Injectable()
export class GenerationStorageService {
  private readonly logger = new Logger(GenerationStorageService.name);
  private generatedQuestionRepository: GeneratedQuestionRepository;

  constructor() {
    this.generatedQuestionRepository = new GeneratedQuestionRepository();
  }

  /**
   * Generates hash and stores a generated question if it doesn't already exist.
   * If it exists, returns the existing question (Reuse Strategy).
   */
  async storeGeneratedQuestion(data: Prisma.GeneratedQuestionUncheckedCreateInput): Promise<GeneratedQuestion> {
    const metadata = (data.metadata as Record<string, unknown>) || {};
    
    const hashParams: HashQuestionParams = {
      templateId: data.templateId,
      parameters: (metadata.parameters as Record<string, unknown>) || {},
      options: data.options as unknown[],
      correctAnswer: data.correctAnswer
    };

    const questionHash = generateQuestionHash(hashParams);

    // Anti-duplication check
    const existing = await this.generatedQuestionRepository.findByHash(questionHash);
    if (existing) {
      this.logger.debug(`Question hash ${questionHash} already exists. Reusing existing question.`);
      return existing;
    }

    // Assign the strict deterministic hash before creation
    const questionToStore = {
      ...data,
      questionHash
    };

    this.logger.debug(`Storing new generated question with hash ${questionHash}.`);
    return await this.generatedQuestionRepository.create(questionToStore);
  }

  /**
   * Batch inserts multiple generated questions using skipDuplicates for high performance.
   * This is heavily used by the Generation Engine during bulk creation.
   */
  async storeGeneratedQuestions(questions: Prisma.GeneratedQuestionUncheckedCreateInput[]): Promise<number> {
    if (!questions.length) return 0;

    const dataWithHashes = questions.map(q => {
      const metadata = (q.metadata as Record<string, unknown>) || {};
      const questionHash = generateQuestionHash({
        templateId: q.templateId,
        parameters: (metadata.parameters as Record<string, unknown>) || {},
        options: q.options as unknown[],
        correctAnswer: q.correctAnswer
      });
      return { ...q, questionHash };
    });

    this.logger.log(`Attempting to batch insert ${dataWithHashes.length} questions...`);
    // The repository method uses createMany({ skipDuplicates: true }) exactly as requested.
    return await this.generatedQuestionRepository.createMany(dataWithHashes);
  }

  async exists(questionHash: string): Promise<boolean> {
    const question = await this.generatedQuestionRepository.findByHash(questionHash);
    return !!question;
  }

  async getQuestion(id: string): Promise<GeneratedQuestion | null> {
    return await this.generatedQuestionRepository.findById(id);
  }
}

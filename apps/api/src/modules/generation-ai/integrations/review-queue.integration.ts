import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionBankService } from "../../question-bank/services/question-bank.service";
import { AIReviewService } from "../../question-review/reviewers/ai-review.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";
import { Question } from "@prisma/client";

@Injectable()
export class ReviewQueueIntegration {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionBankService: QuestionBankService,
    @Inject(forwardRef(() => AIReviewService))
    private readonly aiReviewService: AIReviewService,
  ) {}

  async sendToReviewQueue(
    generated: GeneratedQuestionDto,
  ): Promise<{ question: Question; reviewResult: any }> {
    // 1. Resolve Topic
    const requestedTopic = generated.topic || "General";
    let topic = await this.prisma.topic.findFirst({
      where: {
        OR: [
          { name: { equals: requestedTopic, mode: "insensitive" } },
          { code: { equals: requestedTopic, mode: "insensitive" } },
        ],
      },
    });

    if (!topic) {
      const code = requestedTopic.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      topic = await this.prisma.topic.create({
        data: {
          name: requestedTopic,
          code: code || "topic_" + Date.now(),
          status: "ACTIVE",
        },
      });
    }

    // 2. Resolve ExamSection
    let sectionId: string;
    const sectionTopic = await this.prisma.sectionTopic.findFirst({
      where: { topicId: topic.id },
    });
    
    if (sectionTopic) {
      sectionId = sectionTopic.sectionId;
    } else {
      const existingSection = await this.prisma.examSection.findFirst();
      if (existingSection) {
        sectionId = existingSection.id;
      } else {
        // Create default config and section if database is empty
        let examConfig = await this.prisma.examConfig.findFirst();
        if (!examConfig) {
          examConfig = await this.prisma.examConfig.create({
            data: {
              name: "Default Exam Config",
              code: "DEFAULT_CONFIG",
              description: "Auto-generated default config for generation references",
              role: "ADMIN",
              durationMinutes: 60,
              totalQuestions: 100,
            },
          });
        }
        const newSection = await this.prisma.examSection.create({
          data: {
            examConfigId: examConfig.id,
            code: "general",
            name: "General Section",
            sectionDurationMinutes: 60,
            questionCount: 100,
            sectionOrder: 0,
          },
        });
        sectionId = newSection.id;
      }

      // Link topic and section
      await this.prisma.sectionTopic.upsert({
        where: {
          sectionId_topicId: {
            sectionId,
            topicId: topic.id,
          },
        },
        create: {
          sectionId,
          topicId: topic.id,
        },
        update: {},
      });
    }

    // 3. Create the question in the bank
    const diffUpper = (generated.difficulty || "MEDIUM").toUpperCase();
    const finalDifficulty = ["EASY", "MEDIUM", "HARD"].includes(diffUpper) ? diffUpper : "MEDIUM";

    const question = await this.questionBankService.createQuestion({
      questionText: generated.question,
      answer: generated.answer,
      explanation: generated.explanation,
      topicId: topic.id,
      sectionId,
      difficulty: finalDifficulty,
      source: "GENERATED",
      options: (generated as any).options || [generated.answer],
    });

    // 4. Update the snapshot to include the options if they exist
    const options = (generated as any).options;
    if (options && options.length > 0) {
      const latestVersion = await this.prisma.questionVersion.findFirst({
        where: { questionId: question.id },
        orderBy: { version: "desc" },
      });
      if (latestVersion) {
        const snapshot = latestVersion.snapshot as any;
        snapshot.options = options;
        await this.prisma.questionVersion.update({
          where: { id: latestVersion.id },
          data: { snapshot },
        });
      }
    }

    // 5. Trigger Day 2's AI review pipeline on the question
    const reviewResult = await this.aiReviewService.reviewQuestion(question.id);

    return {
      question,
      reviewResult,
    };
  }
}

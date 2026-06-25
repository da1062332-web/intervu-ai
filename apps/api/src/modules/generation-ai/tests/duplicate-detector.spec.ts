import { DuplicateDetectorService } from "../validators/duplicate-detector.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

describe("DuplicateDetectorService", () => {
  let service: DuplicateDetectorService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      topic: {
        findFirst: jest.fn(),
      },
      question: {
        findMany: jest.fn(),
      },
    } as any;

    service = new DuplicateDetectorService(prisma);
  });

  it("should return duplicate: false when no existing questions match", async () => {
    (prisma.topic.findFirst as jest.Mock).mockResolvedValue({ id: "topic1" });
    (prisma.question.findMany as jest.Mock).mockResolvedValue([
      { questionText: "What is React?" },
    ]);

    const q: GeneratedQuestionDto = {
      question: "What is VueJS?",
      answer: "A frontend framework.",
      explanation: "Expl.",
      difficulty: "Easy",
      topic: "Web Development",
    };

    const result = await service.checkDuplicate(q);
    expect(result.duplicate).toBe(false);
    expect(result.similarity).toBeLessThan(0.85);
  });

  it("should flag duplicate: true on exact match", async () => {
    (prisma.topic.findFirst as jest.Mock).mockResolvedValue({ id: "topic1" });
    (prisma.question.findMany as jest.Mock).mockResolvedValue([
      { questionText: "What is React?" },
    ]);

    const q: GeneratedQuestionDto = {
      question: "What is React?",
      answer: "A UI library.",
      explanation: "Expl.",
      difficulty: "Easy",
      topic: "Web Development",
    };

    const result = await service.checkDuplicate(q);
    expect(result.duplicate).toBe(true);
    expect(result.similarity).toBe(1.0);
  });

  it("should flag duplicate: true on semantic match > 85%", async () => {
    (prisma.topic.findFirst as jest.Mock).mockResolvedValue({ id: "topic1" });
    (prisma.question.findMany as jest.Mock).mockResolvedValue([
      { questionText: "What is React JS library?" },
    ]);

    const q: GeneratedQuestionDto = {
      question: "What is React JS library?", // Identical text
      answer: "A UI library.",
      explanation: "Expl.",
      difficulty: "Easy",
      topic: "Web Development",
    };

    const result = await service.checkDuplicate(q);
    expect(result.duplicate).toBe(true);
    expect(result.similarity).toBeGreaterThan(0.85);
  });
});

import { TopicAlignmentService } from "../validators/topic-alignment.service";
import { MockAdapter } from "../adapters/mock.adapter";
import { GenerationAuditService } from "../services/generation-audit.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";
import { PrismaService } from "../../../prisma/prisma.service";

describe("Additional Coverage Tests", () => {
  describe("TopicAlignmentService Keyword Matching", () => {
    let service: TopicAlignmentService;

    beforeEach(() => {
      service = new TopicAlignmentService();
    });

    it("should match topic based on keywords in question text (percentage)", async () => {
      const q: GeneratedQuestionDto = {
        question: "Find the ratio of increase and calculate the final %.",
        answer: "A",
        explanation: "Exp",
        difficulty: "Easy",
        topic: "Unrelated",
      };

      const result = await service.validate(q, "percentage");
      expect(result.match).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should match topic based on keywords in question text (probability)", async () => {
      const q: GeneratedQuestionDto = {
        question:
          "What is the chance of getting a dice roll of 6 on a coin flip with card decks?",
        answer: "A",
        explanation: "Exp",
        difficulty: "Easy",
        topic: "Unrelated",
      };

      const result = await service.validate(q, "probability");
      expect(result.match).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should match topic based on keywords in question text (coding)", async () => {
      const q: GeneratedQuestionDto = {
        question: "Write an array function with linear time complexity.",
        answer: "A",
        explanation: "Exp",
        difficulty: "Easy",
        topic: "Unrelated",
      };

      const result = await service.validate(q, "coding");
      expect(result.match).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should match topic based on keywords in question text (verbal)", async () => {
      const q: GeneratedQuestionDto = {
        question:
          "Find the synonym and antonym of the word in this sentence with grammar rules.",
        answer: "A",
        explanation: "Exp",
        difficulty: "Easy",
        topic: "Unrelated",
      };

      const result = await service.validate(q, "verbal");
      expect(result.match).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe("MockAdapter Branches", () => {
    let adapter: MockAdapter;

    beforeEach(() => {
      adapter = new MockAdapter();
    });

    it("should parse prompts containing different topics and difficulties correctly", async () => {
      let res = await adapter.generate("probability hard");
      expect(res).toContain('"topic":"Probability"');
      expect(res).toContain('"difficulty":"Hard"');

      res = await adapter.generate("logical");
      expect(res).toContain('"topic":"Logical Reasoning"');

      res = await adapter.generate("verbal");
      expect(res).toContain('"topic":"Verbal Ability"');

      res = await adapter.generate("coding");
      expect(res).toContain('"topic":"Coding"');

      expect(adapter.getLastPrompt()).toBe("coding");
    });
  });

  describe("GenerationAuditService Log Creation", () => {
    let service: GenerationAuditService;
    let prisma: jest.Mocked<PrismaService>;

    beforeEach(() => {
      prisma = {
        generationAuditLog: {
          create: jest.fn(),
        },
      } as any;

      service = new GenerationAuditService(prisma);
    });

    it("should successfully call prisma create with formatted data", async () => {
      const data = {
        prompt: "Prompt",
        response: "Response",
        qualityScore: 90,
        validationResult: { success: true },
      };

      (prisma.generationAuditLog.create as jest.Mock).mockResolvedValue({
        id: "log1",
      });

      const res = await service.log(data);
      expect(prisma.generationAuditLog.create).toHaveBeenCalledWith({
        data: {
          prompt: "Prompt",
          response: "Response",
          qualityScore: 90,
          validationResult: { success: true },
        },
      });
      expect(res.id).toBe("log1");
    });
  });
});

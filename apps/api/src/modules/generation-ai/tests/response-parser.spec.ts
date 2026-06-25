import { BadRequestException } from "@nestjs/common";
import { ResponseParserService } from "../validators/response-parser.service";

describe("ResponseParserService", () => {
  let service: ResponseParserService;

  beforeEach(() => {
    service = new ResponseParserService();
  });

  it("should successfully parse valid JSON output", async () => {
    const raw = `{
      "question": "What is 2 + 2?",
      "answer": "4",
      "explanation": "Simple arithmetic.",
      "difficulty": "Easy",
      "topic": "Math"
    }`;
    const result = await service.parse(raw);
    expect(result.question).toBe("What is 2 + 2?");
    expect(result.answer).toBe("4");
    expect(result.explanation).toBe("Simple arithmetic.");
    expect(result.difficulty).toBe("Easy");
    expect(result.topic).toBe("Math");
  });

  it("should clean markdown wrapper blocks (```json ... ```) and parse", async () => {
    const raw = `\`\`\`json
    {
      "question": "What is 3 + 3?",
      "answer": "6",
      "explanation": "Simple addition.",
      "difficulty": "Easy",
      "topic": "Math"
    }
    \`\`\``;
    const result = await service.parse(raw);
    expect(result.question).toBe("What is 3 + 3?");
    expect(result.answer).toBe("6");
  });

  it("should throw BadRequestException if JSON is malformed", async () => {
    const raw = `{ malformed json }`;
    await expect(service.parse(raw)).rejects.toThrow(BadRequestException);
  });

  it("should throw BadRequestException if fields are missing or empty", async () => {
    const raw = `{
      "question": "",
      "answer": "4",
      "explanation": "Explanation",
      "difficulty": "Easy",
      "topic": "Math"
    }`;
    await expect(service.parse(raw)).rejects.toThrow(BadRequestException);
  });

  it("should throw BadRequestException if input is empty", async () => {
    await expect(service.parse("")).rejects.toThrow(BadRequestException);
  });
});

import { BlueprintValidatorService } from "./blueprint-validator.service";
import { BadRequestException } from "@nestjs/common";
import { AddTopicConfigDto } from "@intervu-ai/contracts";

describe("BlueprintValidatorService", () => {
  let service: BlueprintValidatorService;

  beforeEach(() => {
    service = new BlueprintValidatorService();
  });

  it("Difficulty Validation", () => {
    const dto = {
      questionCount: 10,
      easyCount: 3,
      mediumCount: 4,
      hardCount: 3,
    } as unknown as AddTopicConfigDto;
    expect(() => service.validateDifficulty(dto)).not.toThrow();

    const invalidDto = {
      questionCount: 10,
      easyCount: 3,
      mediumCount: 3,
      hardCount: 3,
    } as unknown as AddTopicConfigDto;
    expect(() => service.validateDifficulty(invalidDto)).toThrow(
      BadRequestException,
    );
  });

  it("Weightage Validation", () => {
    const res = service.validateWeightage(50, 50);
    expect(res.valid).toBe(true);

    const invalidRes = service.validateWeightage(60, 50);
    expect(invalidRes.valid).toBe(false);
  });

  it("Question Validation", () => {
    const res = service.validateQuestionDistribution(40, 20, 20);
    expect(res.valid).toBe(true);

    const invalidRes = service.validateQuestionDistribution(40, 30, 20);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.missingQuestions).toBe(10);
  });
});

import { Injectable, BadRequestException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

@Injectable()
export class ResponseParserService {
  async parse(rawOutput: string): Promise<GeneratedQuestionDto> {
    if (!rawOutput || rawOutput.trim().length === 0) {
      throw new BadRequestException("Raw LLM output is empty");
    }

    let cleaned = rawOutput.trim();
    // Clean markdown json blocks if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```(?:json)?/gi, "")
        .replace(/```$/gi, "")
        .trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e: any) {
      throw new BadRequestException(`Invalid JSON response: ${e.message}`);
    }

    const dto = plainToInstance(GeneratedQuestionDto, parsed);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMsg = errors
        .map((err) => Object.values(err.constraints || {}).join(", "))
        .join("; ");
      throw new BadRequestException(`Missing or invalid fields: ${errorMsg}`);
    }

    return dto;
  }
}

import { Injectable } from "@nestjs/common";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

@Injectable()
export class DifficultyValidatorService {
  async validate(
    generated: GeneratedQuestionDto,
    requestedDifficulty: string,
  ): Promise<boolean> {
    const genDifficulty = (generated.difficulty || "").trim().toLowerCase();
    const reqDifficulty = (requestedDifficulty || "").trim().toLowerCase();

    return genDifficulty === reqDifficulty;
  }
}

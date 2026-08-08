import { Injectable } from "@nestjs/common";
import { DifficultyLevel } from "@prisma/client";

@Injectable()
export class DifficultyValidator {
  validate(
    difficulty: DifficultyLevel,
    parameters: Record<string, any>,
  ): string[] {
    const errors: string[] = [];

    // Optional advisory warnings for difficulty alignment
    if (
      difficulty === DifficultyLevel.EASY &&
      typeof parameters.arraySize === "number" &&
      parameters.arraySize > 50
    ) {
      errors.push(
        `Array size of ${parameters.arraySize} might be too large for EASY difficulty.`,
      );
    }

    return errors;
  }
}

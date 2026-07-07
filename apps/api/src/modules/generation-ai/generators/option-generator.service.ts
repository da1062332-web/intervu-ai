import { Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class OptionGeneratorService {
  /**
   * Processes and validates the generated options, shuffles them,
   * and ensures the correct answer is retained and formatted properly.
   */
  processOptions(
    options: string[],
    correctAnswer: string,
    questionType: string,
  ): {
    shuffledOptions: string[];
    normalizedCorrectAnswer: string;
  } {
    const isMcq = questionType === "mcq" || questionType === "multiple_choice";

    if (!isMcq) {
      return {
        shuffledOptions: [],
        normalizedCorrectAnswer: correctAnswer,
      };
    }

    if (!options || !Array.isArray(options)) {
      throw new BadRequestException("MCQ options must be a valid array");
    }

    // Clean up option whitespaces
    const cleanOptions = options.map((opt) => String(opt).trim());
    const cleanCorrect = String(correctAnswer).trim();

    // 1. Validation Rules
    if (cleanOptions.length !== 4) {
      throw new BadRequestException(
        `MCQ options list must contain exactly 4 options, but got ${cleanOptions.length}`,
      );
    }

    if (cleanOptions.some((opt) => opt === "")) {
      throw new BadRequestException("MCQ options cannot contain empty strings");
    }

    // Check duplicates
    const uniqueOptions = new Set(cleanOptions);
    if (uniqueOptions.size !== cleanOptions.length) {
      throw new BadRequestException("MCQ options must not contain duplicate entries");
    }

    // Verify correct answer exists in options
    if (!cleanOptions.includes(cleanCorrect)) {
      throw new BadRequestException(
        `The correctAnswer "${cleanCorrect}" must be present in the options list: [${cleanOptions.join(", ")}]`,
      );
    }

    // 2. Shuffling (Fisher-Yates)
    const shuffled = [...cleanOptions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
      shuffledOptions: shuffled,
      normalizedCorrectAnswer: cleanCorrect,
    };
  }
}

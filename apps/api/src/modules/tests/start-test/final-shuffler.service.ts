import { Injectable, Logger } from "@nestjs/common";
import { shuffleArray } from "../utils/shuffle.util";

export interface ShufflerSectionData {
  sectionKey: string;
  sectionName: string;
  durationSeconds: number;
  questionCount: number;
  orderIndex: number;
  questions: Array<{
    questionId: string;
    questionOrder: number;
    questionSnapshot: Record<string, any>;
  }>;
}

export interface ShuffleFlags {
  shuffleQuestionsEnabled: boolean;
  shuffleOptionsEnabled: boolean;
}

@Injectable()
export class FinalShufflerService {
  private readonly logger = new Logger(FinalShufflerService.name);

  /**
   * Applies the final shuffle to an array of sections.
   * Shuffles questions within their section and/or options within each question based on the provided flags.
   * Resolves index/relative answers to their exact option text BEFORE shuffling options so that scoring remains 100% accurate.
   *
   * @param sections - The array of section data from assembly.
   * @param flags - The configuration flags dictating what to shuffle.
   * @returns A deep-cloned and shuffled array of section data.
   */
  shuffleSections(
    sections: ShufflerSectionData[],
    flags: ShuffleFlags,
  ): ShufflerSectionData[] {
    const { shuffleQuestionsEnabled, shuffleOptionsEnabled } = flags;

    if (!shuffleQuestionsEnabled && !shuffleOptionsEnabled) {
      return this.deepCloneSections(sections);
    }

    this.logger.debug(
      `Applying Final Shuffle. Questions: ${shuffleQuestionsEnabled}, Options: ${shuffleOptionsEnabled}`,
    );

    // Deep clone first to prevent mutating shared in-memory template data
    const clonedSections = this.deepCloneSections(sections);

    return clonedSections.map((section) => {
      let questions = section.questions;

      if (shuffleQuestionsEnabled && Array.isArray(questions)) {
        // Shuffle questions within the section
        questions = shuffleArray(questions);
        // Re-assign questionOrder to match the new sorted order
        questions.forEach((q, index) => {
          q.questionOrder = index;
        });
      }

      if (shuffleOptionsEnabled && Array.isArray(questions)) {
        questions.forEach((q) => {
          const snapshot = q.questionSnapshot || {};

          // Only shuffle if options exist and questionType is objective (MCQ/MSQ/MULTIPLE_CHOICE)
          const qType = (snapshot.questionType || "MCQ").toUpperCase();
          const isObjective = ["MCQ", "MULTIPLE_CHOICE", "MSQ"].includes(qType);

          if (isObjective && Array.isArray(snapshot.options) && snapshot.options.length >= 2) {
            const rawAnswer = String(snapshot.correctAnswer ?? snapshot.answer ?? "").trim();
            const resolvedAnswer = this.resolveAnswerToCanonicalTarget(rawAnswer, snapshot.options, qType);

            // Shuffle options using Fisher-Yates
            snapshot.options = shuffleArray(snapshot.options);

            // Re-bind resolved answer to ensure scoring matches the correct option post-shuffle
            snapshot.correctAnswer = resolvedAnswer;
            snapshot.answer = resolvedAnswer;
          }
        });
      }

      section.questions = questions;
      return section;
    });
  }

  /**
   * Resolves relative or index-form answers (e.g. "0", "Option A", "A") to the exact option text
   * before option shuffling, preventing scoring inversion.
   */
  private resolveAnswerToCanonicalTarget(rawAnswer: string, options: any[], qType: string): string {
    if (!rawAnswer) return rawAnswer;

    // Handle MSQ multiple answers (comma-separated or JSON array)
    if (qType === "MSQ" && (rawAnswer.includes(",") || rawAnswer.startsWith("["))) {
      let items: string[] = [];
      try {
        if (rawAnswer.startsWith("[")) {
          items = JSON.parse(rawAnswer);
        } else {
          items = rawAnswer.split(",").map((s) => s.trim());
        }
      } catch {
        items = rawAnswer.split(",").map((s) => s.trim());
      }

      const resolved = items.map((item) => this.resolveSingleAnswer(item, options));
      return resolved.join(",");
    }

    return this.resolveSingleAnswer(rawAnswer, options);
  }

  private resolveSingleAnswer(rawAnswer: string, options: any[]): string {
    const trimmed = rawAnswer.trim();

    // 1. Check if rawAnswer is a numeric index: "0", "1", "2"
    if (/^[0-9]+$/.test(trimmed)) {
      const idx = parseInt(trimmed, 10);
      if (idx >= 0 && idx < options.length) {
        const opt = options[idx];
        return typeof opt === "string" ? opt : opt?.text || opt?.value || String(opt);
      }
    }

    // 2. Check if rawAnswer is a letter: "Option A", "A", "B", "C"
    const letterMatch = trimmed.match(/^(?:Option\s+)?([A-D])$/i);
    if (letterMatch) {
      const letter = letterMatch[1].toUpperCase();
      const letterIdx = letter.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1

      // If an option's literal text is this letter, keep it literal
      const hasLiteralText = options.some((opt) => (typeof opt === "string" ? opt : opt?.text) === letter);
      if (!hasLiteralText && letterIdx >= 0 && letterIdx < options.length) {
        const opt = options[letterIdx];
        return typeof opt === "string" ? opt : opt?.text || opt?.value || String(opt);
      }
    }

    // 3. Check if rawAnswer matches an option value/id or text directly
    for (const opt of options) {
      if (typeof opt === "object" && opt !== null) {
        if (opt.value === trimmed || opt.id === trimmed) {
          return opt.value || opt.id;
        }
        if (opt.text === trimmed) {
          return opt.text;
        }
      } else if (String(opt).trim() === trimmed) {
        return String(opt);
      }
    }

    return rawAnswer;
  }

  private deepCloneSections(
    sections: ShufflerSectionData[],
  ): ShufflerSectionData[] {
    return structuredClone(sections);
  }
}

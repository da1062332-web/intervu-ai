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
      // Nothing to do, return original structure safely cloned to prevent accidental mutation downstream.
      return this.deepCloneSections(sections);
    }

    this.logger.debug(
      `Applying Final Shuffle. Questions: ${shuffleQuestionsEnabled}, Options: ${shuffleOptionsEnabled}`,
    );

    // Deep clone first to prevent mutating shared data (Task 8 requirement)
    const clonedSections = this.deepCloneSections(sections);

    return clonedSections.map((section) => {
      let questions = section.questions;

      if (shuffleQuestionsEnabled) {
        // Shuffle questions within the section
        questions = shuffleArray(questions);
        // Re-assign questionOrder to match the new sorted order (Task 3 requirement)
        questions.forEach((q, index) => {
          q.questionOrder = index;
        });
      }

      if (shuffleOptionsEnabled) {
        // Shuffle options inside the snapshot (Task 4 requirement)
        questions.forEach((q) => {
          const snapshot = q.questionSnapshot || {};

          // Only shuffle if options exist and questionType suggests it's safe (e.g. MCQ/MSQ/etc)
          // Defensive check to avoid shuffling CODING or DESCRIPTIVE questions.
          const qType = (snapshot.questionType || "MCQ").toUpperCase();
          const isObjective = ["MCQ", "MULTIPLE_CHOICE", "MSQ"].includes(qType);

          if (isObjective && Array.isArray(snapshot.options)) {
            // Note: correctAnswer string is not altered, because evaluation uses string matching.
            snapshot.options = shuffleArray(snapshot.options);
          }
        });
      }

      section.questions = questions;
      return section;
    });
  }

  private deepCloneSections(
    sections: ShufflerSectionData[],
  ): ShufflerSectionData[] {
    // structuredClone is safe for basic DTOs and JSON snapshots
    return structuredClone(sections);
  }
}

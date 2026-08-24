import { Injectable, BadRequestException } from "@nestjs/common";

export interface NormalizedOptionsResult {
  options: string[];
  correctAnswer: string;
}

/**
 * Normalizes options from various LLM response shapes (e.g. single multi-line string,
 * key-value objects, labeled items like "A) Option") into a clean 4-item array.
 */
export function extractAndNormalizeOptions(
  rawOptions: unknown,
  rawCorrectAnswer: unknown,
): NormalizedOptionsResult {
  let optionsList: string[] = [];
  let cleanCorrect = String(rawCorrectAnswer ?? "").trim();

  // 1. Handle object format: { A: "10", B: "20", C: "30", D: "40" } or { option1: "...", ... }
  if (
    rawOptions &&
    typeof rawOptions === "object" &&
    !Array.isArray(rawOptions)
  ) {
    const entries = Object.entries(rawOptions as Record<string, unknown>);
    entries.sort(([k1], [k2]) =>
      k1.localeCompare(k2, undefined, { numeric: true }),
    );
    optionsList = entries
      .map(([, v]) => String(v ?? "").trim())
      .filter(Boolean);
  } else if (typeof rawOptions === "string") {
    // 2. Handle stringified array or multi-line string
    const trimmed = rawOptions.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          optionsList = parsed.map((item) => String(item ?? "").trim());
        }
      } catch {
        optionsList = [trimmed];
      }
    } else {
      optionsList = [trimmed];
    }
  } else if (Array.isArray(rawOptions)) {
    optionsList = rawOptions.map((opt) => String(opt ?? "").trim());
  }

  // 3. Handle array of 1 element containing multiple options separated by newline or option markers
  if (optionsList.length === 1 && typeof optionsList[0] === "string") {
    const singleStr = optionsList[0].trim();
    if (
      singleStr.includes("\n") ||
      /\b[A-Za-z][).:-]\s+/.test(singleStr) ||
      /\b[1-9][).:-]\s+/.test(singleStr)
    ) {
      const lines = singleStr
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length >= 2 && lines.length <= 6) {
        optionsList = lines;
      } else {
        const splitByLabel = singleStr
          .split(
            /(?:^|\s+)(?:[A-Za-z][).:-]|\([A-Za-z]\)|(?:Option\s+[A-Za-z][).:-]?)|[1-9][).:-]|\([1-9]\)|(?:Option\s+[1-9][).:-]?))\s+/i,
          )
          .map((s) => s.trim())
          .filter(Boolean);
        if (splitByLabel.length >= 2 && splitByLabel.length <= 8) {
          optionsList = splitByLabel;
        }
      }
    }
  }

  // 4. Strip leading option labels from each option:
  // e.g. "A) 10 km/h" -> "10 km/h", "E: sentence" -> "sentence", "Option F: text" -> "text"
  // DO NOT strip from sequence codes like "A-B-C-D" or "W-X-Y-Z"!
  const sequenceCodeCheckRegex =
    /^[A-Za-z][\-–][A-Za-z][\-–][A-Za-z][\-–][A-Za-z]$/i;
  const labelPrefixRegex =
    /^(?:[A-Za-z][).:]|\([A-Za-z]\)|(?:Option\s+[A-Za-z][).:-]?)|[1-9][).:]|\([1-9]\)|(?:Option\s+[1-9][).:-]?)|[A-Za-z]\s+[-–]\s+)\s*/i;

  const originalOptionsBeforeStrip = [...optionsList];
  optionsList = optionsList.map((opt) => {
    const trimmed = opt.trim();
    if (sequenceCodeCheckRegex.test(trimmed)) {
      return trimmed;
    }
    return trimmed.replace(labelPrefixRegex, "").trim();
  });

  // 5. Normalize correct answer:
  // If correctAnswer is a letter like "A", "B", "E", "Option A", "A)", "(A)", "1", "2", "3", "4"
  const letterMatch = cleanCorrect.match(
    /^(?:Option\s+)?([A-Za-z]|[1-9])[).:-]?$/i,
  );
  if (letterMatch && optionsList.length >= 2) {
    const rawChar = letterMatch[1].toUpperCase();
    let idx = -1;
    if (rawChar >= "A" && rawChar <= "Z") {
      // Map A->0, B->1, C->2, D->3, E->4, F->5, ... etc.
      idx = rawChar.charCodeAt(0) - 65;
    } else if (rawChar >= "1" && rawChar <= "9") {
      idx = parseInt(rawChar, 10) - 1;
    }
    if (idx >= 0 && idx < optionsList.length) {
      cleanCorrect = optionsList[idx];
    }
  } else {
    // If cleanCorrect had a prefix stripped like "A) 10 km/h" -> "10 km/h"
    const strippedCorrect = cleanCorrect
      .replace(labelPrefixRegex, "")
      .trim();
    if (optionsList.includes(strippedCorrect)) {
      cleanCorrect = strippedCorrect;
    } else {
      // Check if originalOptionsBeforeStrip matched
      const origIdx = originalOptionsBeforeStrip.findIndex(
        (o) => o.toLowerCase() === cleanCorrect.toLowerCase(),
      );
      if (origIdx !== -1 && origIdx < optionsList.length) {
        cleanCorrect = optionsList[origIdx];
      }
    }
  }

  // 5b. If optionsList has more than 4 items (e.g. 5 options A-E generated), trim to 4 while preserving cleanCorrect
  if (optionsList.length > 4) {
    if (optionsList.includes(cleanCorrect)) {
      const correctIdx = optionsList.indexOf(cleanCorrect);
      if (correctIdx < 4) {
        optionsList = optionsList.slice(0, 4);
      } else {
        optionsList = [
          optionsList[0],
          optionsList[1],
          optionsList[2],
          optionsList[correctIdx],
        ];
      }
    } else {
      optionsList = optionsList.slice(0, 4);
    }
  }

  // 5c. Sequence-Code Auto-Heal:
  // When AI puts sentence fragments in options but a sequence code like "B-A-C-D" or "E-F-G-H" in correctAnswer,
  // auto-generate 4 valid distinct sequence permutation choices.
  const sequenceCodeRegex = /^[A-Za-z][\-–]?[A-Za-z][\-–]?[A-Za-z][\-–]?[A-Za-z]$/i;

  /**
   * Generates up to `needed` distinct permutations from the given letters,
   * excluding those already in `exclude`. Uses a deterministic candidate list
   * covering all common 4-position swaps to guarantee coverage.
   */
  const generateDistinctSequenceOptions = (
    letters: string[],
    correct: string,
    exclude: Set<string>,
  ): string[] => {
    const [a, b, c, d] = letters;
    // Full candidate list — covers all meaningful 4-position swaps
    const candidates = [
      [a, b, c, d].join("-"),
      [b, a, c, d].join("-"),
      [a, b, d, c].join("-"),
      [b, a, d, c].join("-"),
      [a, c, b, d].join("-"),
      [c, a, b, d].join("-"),
      [a, c, d, b].join("-"),
      [a, d, c, b].join("-"),
      [c, b, a, d].join("-"),
      [d, b, c, a].join("-"),
      [b, c, a, d].join("-"),
      [b, d, c, a].join("-"),
      [c, d, a, b].join("-"),
      [d, c, b, a].join("-"),
      [b, c, d, a].join("-"),
      [c, a, d, b].join("-"),
    ];

    const result: string[] = [correct]; // Always include the correct answer first
    const seen = new Set<string>([...exclude, correct]);

    for (const candidate of candidates) {
      if (result.length >= 4) break;
      if (!seen.has(candidate)) {
        seen.add(candidate);
        result.push(candidate);
      }
    }

    return result;
  };

  const isSequenceCode = sequenceCodeRegex.test(cleanCorrect.replace(/\s/g, ""));
  const optionsAreFragments =
    optionsList.length === 4 &&
    !optionsList.some((o) => sequenceCodeRegex.test(o.replace(/\s/g, "")));

  if (isSequenceCode && optionsAreFragments) {
    // Case A: options are sentence fragments, correctAnswer is a sequence code
    // → replace options with 4 distinct permutations
    const normalized = cleanCorrect
      .replace(/\s/g, "")
      .toUpperCase()
      .replace(/[–]/g, "-");
    const letters = normalized.split("-").filter(Boolean);
    if (letters.length === 4) {
      const generatedOptions = generateDistinctSequenceOptions(letters, normalized, new Set());
      if (generatedOptions.length === 4) {
        optionsList = generatedOptions;
        cleanCorrect = normalized;
      }
    }
  }

  // 5d. Sequence-Code Deduplication:
  // Case B: options ARE sequence codes but contain duplicates (e.g. ["A-B-C-D", "B-A-C-D", "A-B-C-D", "C-B-A-D"])
  // → replace duplicates with distinct permutations while preserving the correct answer
  const allOptionsAreSequenceCodes =
    optionsList.length === 4 &&
    optionsList.every((o) => sequenceCodeRegex.test(o.replace(/\s/g, "")));

  if (allOptionsAreSequenceCodes && new Set(optionsList).size < 4) {
    const normalizedCorrectSeq = cleanCorrect
      .replace(/\s/g, "")
      .toUpperCase()
      .replace(/[–]/g, "-");
    const letters = normalizedCorrectSeq.split("-").filter(Boolean);

    if (letters.length === 4) {
      const existing = new Set<string>(
        optionsList
          .map((o) => o.replace(/\s/g, "").toUpperCase().replace(/[–]/g, "-"))
          .filter((o, idx, arr) => arr.indexOf(o) === idx), // unique only
      );
      const deduplicated = generateDistinctSequenceOptions(
        letters,
        normalizedCorrectSeq,
        new Set(), // start fresh — let generator pick the best distinct set
      );
      if (deduplicated.length === 4) {
        optionsList = deduplicated;
        cleanCorrect = normalizedCorrectSeq;
      }
    }
  }

  // 6. Handle length disparity / commentary trimming if option ends with parenthesis explanation

  if (optionsList.length === 4) {
    const lengths = optionsList.map((o) => o.length);
    const minLen = Math.min(...lengths);
    const maxLen = Math.max(...lengths);
    if (minLen > 0 && maxLen / minLen > 6.0) {
      const trimmedOptions = optionsList.map((opt) => {
        if (opt.length > 50 && /\s+\([^)]+\)$/.test(opt)) {
          return opt.replace(/\s+\([^)]+\)$/, "").trim();
        }
        return opt;
      });
      if (
        new Set(trimmedOptions).size === 4 &&
        trimmedOptions.every((o) => o.length > 0)
      ) {
        const idx = optionsList.indexOf(cleanCorrect);
        if (idx !== -1) {
          cleanCorrect = trimmedOptions[idx];
        }
        optionsList = trimmedOptions;
      }
    }
  }

  return {
    options: optionsList,
    correctAnswer: cleanCorrect,
  };
}

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
    const normalizedQuestionType = String(questionType || "")
      .trim()
      .toLowerCase();
    const isMcq =
      normalizedQuestionType === "mcq" ||
      normalizedQuestionType === "multiple_choice";

    if (!isMcq) {
      return {
        shuffledOptions: [],
        normalizedCorrectAnswer: correctAnswer,
      };
    }

    if (!options || (!Array.isArray(options) && typeof options !== "object")) {
      throw new BadRequestException("MCQ options must be a valid array");
    }

    // Auto-normalize and extract options
    const normalized = extractAndNormalizeOptions(options, correctAnswer);
    const cleanOptions = normalized.options;
    const cleanCorrect = normalized.correctAnswer;

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
      throw new BadRequestException(
        "MCQ options must not contain duplicate entries",
      );
    }

    // Verify correct answer exists in options
    if (!cleanOptions.includes(cleanCorrect)) {
      throw new BadRequestException(
        `The correctAnswer "${cleanCorrect}" must be present in the options list: [${cleanOptions.join(", ")}]`,
      );
    }

    // 1b. Option Length Parity Check with exemptions for code, math and short options
    const lengths = cleanOptions.map((opt) => opt.length);
    const minLen = Math.min(...lengths);
    const maxLen = Math.max(...lengths);
    const hasCodeSyntax = cleanOptions.some(
      (opt) =>
        opt.includes("`") ||
        /({|}|\bconst\b|\bdef\b|=>|\bimport\b|\bfunction\b|\bpublic\s+class\b|<html>|<\/html>|\bconsole\.log\b|;|\[|\])/.test(
          opt,
        ),
    );
    const allShort = cleanOptions.every((opt) => opt.length < 50);

    if (!hasCodeSyntax && !allShort && minLen > 0) {
      if (maxLen / minLen > 6.0) {
        throw new BadRequestException(
          `Option length mismatch: the options are not of balanced lengths (longest option is more than 6x the length of the shortest option). Longest: ${maxLen} chars, Shortest: ${minLen} chars.`,
        );
      }
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


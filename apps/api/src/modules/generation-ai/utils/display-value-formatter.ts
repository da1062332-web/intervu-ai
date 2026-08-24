export function formatDisplayValue(
  value: unknown,
  options?: { currencyLike?: boolean },
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value);
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  if (options?.currencyLike) {
    return String(Math.round(value));
  }

  const rounded = value.toFixed(2);
  return rounded.endsWith(".00") ? String(Math.round(value)) : rounded;
}

export function formatDisplayString(text: unknown): string {
  if (typeof text === "number") {
    return formatDisplayValue(text);
  }

  if (typeof text !== "string") {
    return String(text);
  }

  return text.replace(/-?\d+\.\d+/g, (match, offset, source) => {
    const before = source.slice(0, offset);
    const after = source.slice(offset + match.length);

    if (before.endsWith("/") || after.startsWith("/")) {
      return match;
    }

    if (before.endsWith(":") || after.startsWith(":")) {
      return match;
    }

    const decimalPart = match.split(".")[1] || "";
    if (decimalPart.length <= 2) {
      return match;
    }

    return formatInterpolatedDisplayValue(source, offset, Number(match));
  });
}

export function normalizeDisplayOption(option: any): any {
  if (option === null || option === undefined) return option;
  if (typeof option === "string" || typeof option === "number") {
    return formatDisplayString(option);
  }
  if (typeof option === "object") {
    const copy = { ...option };
    if (typeof copy.text === "string" || typeof copy.text === "number") {
      copy.text = formatDisplayString(copy.text);
    }
    if (typeof copy.value === "string" || typeof copy.value === "number") {
      copy.value = formatDisplayString(copy.value);
    }
    if (typeof copy.label === "string" || typeof copy.label === "number") {
      copy.label = formatDisplayString(copy.label);
    }
    return copy;
  }
  return option;
}

export function isPlaceholderOptions(options: any[]): boolean {
  if (!Array.isArray(options) || options.length === 0) return true;
  const dummyStrings = new Set([
    "option a",
    "option b",
    "option c",
    "option d",
    "opt1",
    "opt2",
    "opt3",
    "opt4",
  ]);
  return options.every((opt) => {
    const text = (
      typeof opt === "string" ? opt : opt?.text || opt?.value || ""
    )
      .trim()
      .toLowerCase();
    return dummyStrings.has(text) || text === "";
  });
}

export function synthesizeNumericDistractors(
  targetVal: number | string,
  optionsCount: number = 4,
): string[] {
  const numVal =
    typeof targetVal === "number"
      ? targetVal
      : parseFloat(String(targetVal).trim());
  if (isNaN(numVal) || !Number.isFinite(numVal)) {
    return [];
  }

  const isInt = Number.isInteger(numVal);
  const formattedTarget = isInt ? String(numVal) : formatDisplayValue(numVal);
  const distractors = new Set<string>();

  const perturbations = [
    (v: number) => v + (isInt ? 1 : 0.5),
    (v: number) => v - (isInt ? 1 : 0.5),
    (v: number) => v + (isInt ? 2 : 0.1),
    (v: number) => v - (isInt ? 2 : 0.1),
    (v: number) => v * 1.2,
    (v: number) => v * 0.8,
    (v: number) => v + (isInt ? 5 : 1.5),
    (v: number) => v - (isInt ? 5 : 1.5),
    (v: number) => v * 1.5,
    (v: number) => v * 0.5,
  ];

  for (const perturb of perturbations) {
    if (distractors.size >= optionsCount - 1) break;
    const rawVal = perturb(numVal);
    if (rawVal <= 0 && numVal > 0) continue;
    const formatted = formatDisplayValue(rawVal);
    if (formatted !== formattedTarget) {
      distractors.add(formatted);
    }
  }

  let offset = 1;
  while (distractors.size < optionsCount - 1) {
    const rawVal = numVal + (isInt ? offset : offset * 0.5);
    const formatted = formatDisplayValue(rawVal);
    if (formatted !== formattedTarget) {
      distractors.add(formatted);
    }
    offset += 1;
  }

  const all = [
    formattedTarget,
    ...Array.from(distractors).slice(0, optionsCount - 1),
  ];
  return all.sort(() => Math.random() - 0.5);
}

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
      /\b[A-Da-d][).:-]\s+/.test(singleStr) ||
      /\b[1-4][).:-]\s+/.test(singleStr)
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
            /(?:^|\s+)(?:[A-Da-d][).:-]|\([A-Da-d]\)|(?:Option\s+[A-Da-d][).:-]?)|[1-4][).:-]|\([1-4]\)|(?:Option\s+[1-4][).:-]?))\s+/i,
          )
          .map((s) => s.trim())
          .filter(Boolean);
        if (splitByLabel.length >= 2 && splitByLabel.length <= 6) {
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
  // If correctAnswer is a letter like "A", "B", "E", "Option A", "A)", "(A)", "1", "2", ...
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

  // 5c. Sequence-Code Auto-Heal (same logic as option-generator.service.ts):
  const sequenceCodeRegex = /^[A-Za-z][\-–]?[A-Za-z][\-–]?[A-Za-z][\-–]?[A-Za-z]$/i;

  const generateDistinctSeqOptions = (
    letters: string[],
    correct: string,
    _exclude: Set<string>,
  ): string[] => {
    const [a, b, c, d] = letters;
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
    const result: string[] = [correct];
    const seen = new Set<string>([correct]);
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
    const normalized = cleanCorrect
      .replace(/\s/g, "")
      .toUpperCase()
      .replace(/[–]/g, "-");
    const letters = normalized.split("-").filter(Boolean);
    if (letters.length === 4) {
      const generated = generateDistinctSeqOptions(letters, normalized, new Set());
      if (generated.length === 4) {
        optionsList = generated;
        cleanCorrect = normalized;
      }
    }
  }

  // 5d. Sequence-Code Deduplication: options ARE sequence codes but contain duplicates
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
      const deduplicated = generateDistinctSeqOptions(letters, normalizedCorrectSeq, new Set());
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

export function normalizeDisplayQuestion<
  T extends {
    question?: unknown;
    questionText?: unknown;
    options?: unknown[];
    correctAnswer?: unknown;
    answer?: unknown;
    explanation?: unknown;
  },
>(question: T): T {
  const rawAnswer = question.correctAnswer ?? question.answer;
  const answerStr = String(rawAnswer ?? "").trim();

  // First auto-extract and normalize options if present
  let baseOptions = question.options;
  let normalizedCorrect = answerStr;
  if (baseOptions !== undefined && baseOptions !== null) {
    const extracted = extractAndNormalizeOptions(baseOptions, rawAnswer);
    if (extracted.options.length > 0) {
      baseOptions = extracted.options;
    }
    if (extracted.correctAnswer) {
      normalizedCorrect = extracted.correctAnswer;
    }
  }

  let normalizedOptions = Array.isArray(baseOptions)
    ? baseOptions.map((option) => normalizeDisplayOption(option))
    : baseOptions;

  // If options are empty or placeholder Option A-D and answer is numeric, synthesize valid options
  if (
    (!Array.isArray(normalizedOptions) ||
      normalizedOptions.length === 0 ||
      isPlaceholderOptions(normalizedOptions)) &&
    normalizedCorrect &&
    !isNaN(Number(normalizedCorrect))
  ) {
    normalizedOptions = synthesizeNumericDistractors(Number(normalizedCorrect));
  }

  const optionMap = new Map<string, string>();
  if (Array.isArray(baseOptions) && Array.isArray(normalizedOptions)) {
    baseOptions.forEach((option, index) => {
      const origText =
        typeof option === "string"
          ? option.trim()
          : String((option as any)?.text || (option as any)?.value || "").trim();
      const normText =
        typeof normalizedOptions[index] === "string"
          ? normalizedOptions[index].trim()
          : String(
              (normalizedOptions[index] as any)?.text ||
                (normalizedOptions[index] as any)?.value ||
                "",
            ).trim();
      if (origText) {
        optionMap.set(origText, normText);
      }
    });
  }

  const normalizeAnswer = (answer: unknown) => {
    const raw = String(answer ?? "").trim();
    return (
      optionMap.get(raw) ||
      optionMap.get(normalizedCorrect) ||
      formatDisplayString(normalizedCorrect || answer)
    );
  };

  return {
    ...question,
    question:
      question.question !== undefined
        ? formatDisplayString(question.question)
        : question.question,
    questionText:
      question.questionText !== undefined
        ? formatDisplayString(question.questionText)
        : question.questionText,
    options: normalizedOptions,
    correctAnswer:
      question.correctAnswer !== undefined
        ? normalizeAnswer(question.correctAnswer)
        : question.correctAnswer,
    answer:
      question.answer !== undefined
        ? normalizeAnswer(question.answer)
        : question.answer,
    explanation:
      question.explanation !== undefined
        ? formatDisplayString(question.explanation)
        : question.explanation,
  };
}

export function formatInterpolatedDisplayValue(
  templateText: string,
  placeholderIndex: number,
  value: unknown,
): string {
  const precedingText = templateText.slice(
    Math.max(0, placeholderIndex - 16),
    placeholderIndex,
  );
  const currencyLike = /(?:rs\.?|inr|₹|rupees?)\s*$/i.test(precedingText);
  return formatDisplayValue(value, { currencyLike });
}

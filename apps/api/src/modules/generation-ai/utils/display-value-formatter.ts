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
  let normalizedOptions = Array.isArray(question.options)
    ? question.options.map((option) => normalizeDisplayOption(option))
    : question.options;

  const rawAnswer = question.correctAnswer ?? question.answer;
  const answerStr = String(rawAnswer ?? "").trim();

  // If options are empty or placeholder Option A-D and answer is numeric, synthesize valid options
  if (
    (!Array.isArray(normalizedOptions) ||
      normalizedOptions.length === 0 ||
      isPlaceholderOptions(normalizedOptions)) &&
    answerStr &&
    !isNaN(Number(answerStr))
  ) {
    normalizedOptions = synthesizeNumericDistractors(Number(answerStr));
  }

  const optionMap = new Map<string, string>();
  if (Array.isArray(question.options) && Array.isArray(normalizedOptions)) {
    question.options.forEach((option, index) => {
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
    return optionMap.get(raw) || formatDisplayString(answer);
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

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
  const normalizedOptions = Array.isArray(question.options)
    ? question.options.map((option) => formatDisplayString(option))
    : question.options;

  const optionMap = new Map<string, string>();
  if (Array.isArray(question.options) && Array.isArray(normalizedOptions)) {
    question.options.forEach((option, index) => {
      optionMap.set(
        String(option).trim(),
        String(normalizedOptions[index]).trim(),
      );
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

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

export function formatInterpolatedDisplayValue(
  templateText: string,
  placeholderIndex: number,
  value: unknown,
): string {
  const precedingText = templateText.slice(Math.max(0, placeholderIndex - 16), placeholderIndex);
  const currencyLike = /(?:rs\.?|inr|₹|rupees?)\s*$/i.test(precedingText);
  return formatDisplayValue(value, { currencyLike });
}

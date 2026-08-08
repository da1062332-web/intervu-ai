import type { NormalizedApiError } from '@/types/api.types';

export interface PreviewErrorDisplay {
  title: string;
  summary: string;
  details: string[];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getContextValue(context: unknown, key: string): string | null {
  if (!context || typeof context !== 'object') {
    return null;
  }

  const value = (context as Record<string, unknown>)[key];
  return asString(value);
}

export function buildPreviewErrorDisplay(
  error: Partial<NormalizedApiError> | null | undefined,
): PreviewErrorDisplay {
  const message = asString(error?.message) ?? 'Template configuration error.';
  const details = (
    error?.details && typeof error.details === 'object' ? error.details : {}
  ) as Record<string, unknown>;
  const category = asString(error?.category) ?? asString(details.category) ?? 'UNKNOWN_ERROR';
  const reason = asString(error?.reason) ?? asString(details.reason) ?? message;
  const context = (
    details.context && typeof details.context === 'object' ? details.context : {}
  ) as Record<string, unknown>;

  switch (category.toUpperCase()) {
    case 'FORMULA_ERROR': {
      const unknownSymbol = getContextValue(context, 'unknownSymbol');
      const formula = getContextValue(context, 'formula');
      const detailsList = [
        unknownSymbol ? `Unknown variable: ${unknownSymbol}` : null,
        formula ? `Formula: ${formula}` : null,
        'Check the derived variables and formulas in the template.',
      ].filter(Boolean) as string[];

      return {
        title: 'Formula error',
        summary: reason,
        details: detailsList,
      };
    }
    case 'PLACEHOLDER_ERROR': {
      const placeholders = Array.isArray(context.placeholders)
        ? context.placeholders.filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0,
          )
        : [];
      const detailsList = [
        placeholders.length > 0 ? `Missing placeholder: ${placeholders.join(', ')}` : null,
        'Check the question template and solution template for unresolved placeholders.',
      ].filter(Boolean) as string[];

      return {
        title: 'Placeholder error',
        summary: reason,
        details: detailsList,
      };
    }
    case 'VARIABLE_GENERATION_ERROR': {
      return {
        title: 'Variable generation error',
        summary: reason,
        details: ['Check the variable definitions and constraints in the template.'],
      };
    }
    case 'AI_SERVICE_ERROR': {
      return {
        title: 'AI service unavailable',
        summary: reason,
        details: ['Please try again in a moment.'],
      };
    }
    default:
      return {
        title: 'Template configuration error',
        summary: message,
        details: [],
      };
  }
}

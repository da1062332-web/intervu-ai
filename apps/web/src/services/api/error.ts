import type { ApiErrorDetails, ApiErrorResponse, NormalizedApiError } from '@/types/api.types';

const FALLBACK_ERROR_CODE = 'UNKNOWN_ERROR';

const FALLBACK_ERROR_MESSAGE = 'Something went wrong. Please try again.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  if (!isRecord(payload)) {
    return false;
  }

  if (payload.success !== false) {
    return false;
  }

  if (!isRecord(payload.error)) {
    return false;
  }

  return typeof payload.error.code === 'string' && typeof payload.error.message === 'string';
}

function mapValidationErrors(details?: ApiErrorDetails): Record<string, string[]> {
  if (!details) {
    return {};
  }

  return Object.entries(details).reduce<Record<string, string[]>>((acc, [key, value]) => {
    acc[key] = Array.isArray(value) ? value : [value];
    return acc;
  }, {});
}

function buildNormalizedError(
  error: Partial<Omit<NormalizedApiError, 'name'>>,
): NormalizedApiError {
  const normalized = new Error(error.message ?? FALLBACK_ERROR_MESSAGE) as NormalizedApiError;

  normalized.name = 'ApiError';
  normalized.code = error.code ?? FALLBACK_ERROR_CODE;
  normalized.status = error.status ?? 500;
  normalized.validationErrors = error.validationErrors ?? {};
  normalized.isApiError = true;
  normalized.raw = error.raw;
  normalized.notified = error.notified;

  return normalized;
}

export function normalizeApiError(input: unknown, fallbackStatus = 500): NormalizedApiError {
  if (input instanceof Error && 'isApiError' in input && input.isApiError) {
    return input as NormalizedApiError;
  }

  if (isApiErrorResponse(input)) {
    return buildNormalizedError({
      code: input.error.code,
      message: input.error.message ?? FALLBACK_ERROR_MESSAGE,
      status: fallbackStatus,
      validationErrors: mapValidationErrors(input.error.details),
      raw: input,
    });
  }

  if (input instanceof Error) {
    return buildNormalizedError({
      code: FALLBACK_ERROR_CODE,
      message: input.message || FALLBACK_ERROR_MESSAGE,
      status: fallbackStatus,
      raw: input,
    });
  }

  return buildNormalizedError({
    code: FALLBACK_ERROR_CODE,
    message: FALLBACK_ERROR_MESSAGE,
    status: fallbackStatus,
    raw: input,
  });
}

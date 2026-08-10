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

function getErrorPayload(input: unknown): ApiErrorResponse | null {
  if (isApiErrorResponse(input)) {
    return input;
  }

  if (isRecord(input)) {
    const maybeResponse = input.response;
    if (isRecord(maybeResponse) && isApiErrorResponse(maybeResponse.data)) {
      return maybeResponse.data as ApiErrorResponse;
    }

    if (isRecord(input.data) && isApiErrorResponse(input.data)) {
      return input.data as ApiErrorResponse;
    }
  }

  return null;
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
  let errorMessage = error.message ?? FALLBACK_ERROR_MESSAGE;

  // Make concept pool errors user-friendly globally
  const poolMatch = errorMessage.match(/Question pool empty and generation failed for concept/i);
  if (poolMatch) {
    errorMessage =
      'This assessment cannot be started at the moment because it is missing some required questions. Please contact your administrator or support team.';
  }

  const normalized = new Error(errorMessage) as NormalizedApiError;

  normalized.name = 'ApiError';
  normalized.code = error.code ?? FALLBACK_ERROR_CODE;
  normalized.status = error.status ?? 500;
  normalized.validationErrors = error.validationErrors ?? {};
  normalized.category = error.category;
  normalized.reason = error.reason;
  normalized.details = error.details;
  normalized.isApiError = true;
  normalized.raw = error.raw;
  normalized.notified = error.notified;

  return normalized;
}

export function extractPreviewErrorData(details?: ApiErrorDetails) {
  if (!details || typeof details !== 'object') {
    return { category: undefined, reason: undefined, details };
  }

  const category = typeof details.category === 'string' ? details.category : undefined;
  const reason = typeof details.reason === 'string' ? details.reason : undefined;

  return { category, reason, details };
}

export function normalizeApiError(input: unknown, fallbackStatus = 500): NormalizedApiError {
  if (input instanceof Error && 'isApiError' in input && input.isApiError) {
    return input as NormalizedApiError;
  }

  const payload = getErrorPayload(input);
  if (payload) {
    const previewErrorData = extractPreviewErrorData(payload.error.details);

    return buildNormalizedError({
      code: payload.error.code,
      message: payload.error.message ?? FALLBACK_ERROR_MESSAGE,
      status: fallbackStatus,
      validationErrors: mapValidationErrors(payload.error.details),
      category: previewErrorData.category,
      reason: previewErrorData.reason,
      details: previewErrorData.details,
      raw: input,
    });
  }

  if (input instanceof TypeError && input.message.includes('fetch')) {
    return buildNormalizedError({
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your internet connection.',
      status: 0,
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

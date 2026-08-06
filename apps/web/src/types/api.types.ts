export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  error: null;
  meta: unknown;
  message?: string;
  timestamp?: string;
  path?: string;
}

export interface ApiErrorDetails {
  [field: string]: unknown;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetails;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiErrorPayload;
  meta: null;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export interface NormalizedApiError extends Error {
  code: string;
  status: number;
  validationErrors: Record<string, string[]>;
  category?: string;
  reason?: string;
  details?: ApiErrorDetails;
  isApiError: true;
  raw?: unknown;
  notified?: boolean;
}

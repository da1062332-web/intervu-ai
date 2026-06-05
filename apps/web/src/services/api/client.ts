import type { ApiResponse, ApiSuccessResponse } from '@/types/api.types';
import { useUIStore } from '@/store/ui.store';
import { normalizeApiError } from '@/services/api/error';
import { notifyApiError } from '@/services/notifications/toast';

type QueryPrimitive = string | number | boolean;

type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;

export interface ApiRequestConfig extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: HeadersInit;
  query?: Record<string, QueryValue>;
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
  skipErrorToast?: boolean;
  trackLoading?: boolean;
}

interface InternalRequestConfig extends ApiRequestConfig {
  url: string;
  _retry: boolean;
}

interface AuthClientHooks {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<string | null>;
  onUnauthorized: () => void;
}

type RequestInterceptor = (
  config: InternalRequestConfig,
) => InternalRequestConfig | Promise<InternalRequestConfig>;

type ResponseInterceptor = (
  response: Response,
  config: InternalRequestConfig,
) => Response | Promise<Response>;

const API_PREFIX = '/api/v1';

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const apiAuthHooks: Partial<AuthClientHooks> = {};

export function configureApiAuthHooks(hooks: Partial<AuthClientHooks>): void {
  Object.assign(apiAuthHooks, hooks);
}

function isApiSuccess<TData>(payload: unknown): payload is ApiSuccessResponse<TData> {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const maybeResponse = payload as Partial<ApiSuccessResponse<TData>>;

  return maybeResponse.success === true;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_PREFIX}${normalizedPath}`, normalizedBaseUrl);

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }

    url.searchParams.append(key, String(value));
  }

  return url.toString();
}

function normalizeBaseUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl);
  const pathname = parsed.pathname.replace(/\/$/, '');

  if (pathname.endsWith(API_PREFIX)) {
    parsed.pathname = pathname.slice(0, -API_PREFIX.length);
    return parsed.toString().replace(/\/$/, '');
  }

  parsed.pathname = pathname || '/';
  return parsed.toString().replace(/\/$/, '');
}

function normalizeBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === null || body === undefined) {
    return undefined;
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    typeof body === 'string'
  ) {
    return body;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

class ApiClient {
  private requestInterceptors: RequestInterceptor[] = [];

  private responseInterceptors: ResponseInterceptor[] = [];

  private refreshPromise: Promise<string | null> | null = null;

  constructor(private readonly baseUrl: string) {
    this.addRequestInterceptor(this.defaultRequestInterceptor);
  }

  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);

    return () => {
      this.requestInterceptors = this.requestInterceptors.filter((entry) => entry !== interceptor);
    };
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);

    return () => {
      this.responseInterceptors = this.responseInterceptors.filter(
        (entry) => entry !== interceptor,
      );
    };
  }

  async request<TData>(path: string, config: ApiRequestConfig = {}): Promise<TData> {
    const response = await this.dispatchRequest(path, {
      ...config,
      _retry: false,
    });
    const parsed = await parseResponseBody(response);

    if (!response.ok) {
      const normalized = normalizeApiError(parsed, response.status);

      if (!config.skipErrorToast) {
        notifyApiError(normalized);
      }

      throw normalized;
    }

    if (response.status === 204) {
      return undefined as TData;
    }

    if (isApiSuccess<TData>(parsed)) {
      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        return (parsed as ApiSuccessResponse<TData>).data;
      }

      return parsed as TData;
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      'success' in parsed &&
      (parsed as ApiResponse<TData>).success === false
    ) {
      const normalized = normalizeApiError(parsed, response.status);

      if (!config.skipErrorToast) {
        notifyApiError(normalized);
      }

      throw normalized;
    }

    return parsed as TData;
  }

  private defaultRequestInterceptor = (config: InternalRequestConfig): InternalRequestConfig => {
    const headers = new Headers(config.headers);

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (!config.skipAuth) {
      const token = apiAuthHooks.getAccessToken?.();

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return {
      ...config,
      headers,
    };
  };

  private async dispatchRequest(
    path: string,
    config: Omit<InternalRequestConfig, 'url'>,
  ): Promise<Response> {
    const trackLoading = config.trackLoading ?? true;

    if (trackLoading) {
      useUIStore.getState().startLoading();
    }

    try {
      const withUrl: InternalRequestConfig = {
        ...config,
        url: buildUrl(this.baseUrl, path, config.query),
      };

      let interceptedConfig = withUrl;

      for (const interceptor of this.requestInterceptors) {
        interceptedConfig = await interceptor(interceptedConfig);
      }

      const headers = new Headers(interceptedConfig.headers);
      const requestBody = normalizeBody(interceptedConfig.body, headers);

      const response = await fetch(interceptedConfig.url, {
        ...interceptedConfig,
        body: requestBody,
        headers,
      });

      let interceptedResponse = response;

      for (const interceptor of this.responseInterceptors) {
        interceptedResponse = await interceptor(interceptedResponse, interceptedConfig);
      }

      if (
        interceptedResponse.status === 401 &&
        !interceptedConfig.skipAuthRefresh &&
        !interceptedConfig._retry
      ) {
        const refreshedToken = await this.refreshAccessToken();

        if (refreshedToken) {
          return this.dispatchRequest(path, {
            ...config,
            _retry: true,
          });
        }

        apiAuthHooks.onUnauthorized?.();
      }

      return interceptedResponse;
    } catch (error) {
      const normalized = normalizeApiError(error);

      if (!config.skipErrorToast) {
        notifyApiError(normalized);
      }

      throw normalized;
    } finally {
      if (trackLoading) {
        useUIStore.getState().stopLoading();
      }
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!apiAuthHooks.refreshSession) {
      return null;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = apiAuthHooks.refreshSession().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }
}

export const apiClient = new ApiClient(DEFAULT_BASE_URL);

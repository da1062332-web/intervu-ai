import { AsyncLocalStorage } from "async_hooks";

export interface RequestContextData {
  requestId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

export const requestContextStorage =
  new AsyncLocalStorage<RequestContextData>();

export function getRequestContext(): RequestContextData | undefined {
  return requestContextStorage.getStore();
}

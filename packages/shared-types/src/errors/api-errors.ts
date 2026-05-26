import { ErrorCode } from './error-codes';

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}
/**
 * Utilities for enforcing engineering standards in CI/CD or runtime checks.
 */

export function validateDtoNaming(name: string): boolean {
  return (
    name.endsWith("RequestDto") ||
    name.endsWith("ResponseDto") ||
    name.endsWith("Dto")
  );
}

export function validateFolderConvention(path: string): boolean {
  const allowedFolders = [
    "controllers",
    "services",
    "repositories",
    "dto",
    "validators",
  ];
  return allowedFolders.some(
    (folder) => path.includes(`/${folder}/`) || path.includes(`\\${folder}\\`),
  );
}

export class ApiResponseDto<T = any> {
  success!: boolean;
  data!: T | null;
  error!: {
    code: string;
    message: string;
    details?: any;
  } | null;
  meta!: {
    timestamp: string;
    [key: string]: any;
  } | null;
}

export class ErrorResponseDto {
  success = false as const;
  data: null = null;
  error!: {
    code: string;
    message: string;
    details?: any;
  };
  meta!: {
    timestamp: string;
    [key: string]: any;
  };
}

export class ResponseBuilder {
  static success<T>(data: T, meta?: Record<string, any>): ApiResponseDto<T> {
    return {
      success: true,
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        ...(meta || {}),
      },
    };
  }

  static error(
    code: string,
    message: string,
    details?: any,
    meta?: Record<string, any>,
  ): ErrorResponseDto {
    return {
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...(meta || {}),
      },
    };
  }
}

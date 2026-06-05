import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";
    let details: unknown = undefined;

    // Support for custom BaseError
    if (
      exception &&
      typeof exception === "object" &&
      "code" in exception &&
      typeof (exception as Record<string, unknown>).code === "string"
    ) {
      const baseErr = exception as Record<string, unknown>;
      code = String(baseErr.code);
      message = String(baseErr.message);
      details = baseErr.details;
      if (code === "VALIDATION_ERROR" || code === "CONTRACT_ERROR")
        status = HttpStatus.BAD_REQUEST;
      else if (code === "NOT_FOUND") status = HttpStatus.NOT_FOUND;
      else if (code === "UNAUTHORIZED") status = HttpStatus.UNAUTHORIZED;
      else if (code === "FORBIDDEN") status = HttpStatus.FORBIDDEN;
      else status = HttpStatus.BAD_REQUEST;
    }
    // Support for Prisma Errors dynamically
    else if (
      exception &&
      typeof exception === "object" &&
      exception.constructor?.name?.startsWith("Prisma")
    ) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = "DATABASE_ERROR";
      message = "A database error occurred";
      if ((exception as Record<string, unknown>).code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        code = "NOT_FOUND";
        message = "Record not found";
      }
    }
    // Support for ZodError
    else if (
      exception &&
      typeof exception === "object" &&
      exception.constructor?.name === "ZodError"
    ) {
      status = HttpStatus.BAD_REQUEST;
      code = "VALIDATION_ERROR";
      message = "Validation failed";
      details = (exception as { issues: unknown }).issues;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: unknown = exception.getResponse();

      // If it's already in our standard format, use it
      if (
        typeof res === "object" &&
        res !== null &&
        "success" in res &&
        (res as Record<string, unknown>).success === false &&
        "error" in res
      ) {
        return response.status(status).json(res);
      }

      code =
        typeof res === "object" && res !== null && "error" in res
          ? String((res as Record<string, unknown>).error)
          : "HTTP_ERROR";
      if (status === HttpStatus.NOT_FOUND) code = "NOT_FOUND";
      if (status === HttpStatus.UNAUTHORIZED) code = "UNAUTHORIZED";
      if (status === HttpStatus.FORBIDDEN) code = "FORBIDDEN";

      message =
        typeof res === "object" && res !== null && "message" in res
          ? String((res as Record<string, unknown>).message)
          : exception.message;
      details = res;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message,
        details:
          status === HttpStatus.INTERNAL_SERVER_ERROR ? undefined : details,
      },
      meta: null,
    });
  }
}

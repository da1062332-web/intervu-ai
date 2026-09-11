import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AppLogger } from "@intervu-ai/shared-logger";

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  private readonly logger = new AppLogger({ name: "GlobalErrorFilter" });

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const traceId = (request.headers["x-correlation-id"] ||
      request.headers["x-request-id"] ||
      "unknown") as string;

    const method = request.method;
    const url = request.originalUrl || request.url;
    const userId =
      (request as any).user?.id || (request as any).userId || undefined;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let errorCode = "INTERNAL_SERVER_ERROR";
    let message =
      exception instanceof Error
        ? exception.message
        : "An unexpected error occurred";
    let details: unknown = null;

    if (exceptionResponse && typeof exceptionResponse === "object") {
      const respObj = exceptionResponse as Record<string, unknown>;
      errorCode =
        (respObj.code as string) || (respObj.error as string) || "HTTP_ERROR";
      const respMsg = respObj.message;
      message = Array.isArray(respMsg)
        ? respMsg.join(", ")
        : (respMsg as string) || message;
      details = respObj.details || null;
    } else if (exception && typeof exception === "object") {
      const excObj = exception as Record<string, unknown>;
      if (excObj.code && typeof excObj.code === "string") {
        errorCode = excObj.code;
        message = (excObj.message as string) || message;
        details = excObj.details || null;

        if (excObj.code === "NOT_FOUND") {
          status = HttpStatus.NOT_FOUND;
        } else if (
          excObj.code === "VALIDATION_ERROR" ||
          excObj.code === "TOPIC_ALREADY_MAPPED" ||
          excObj.code === "WEIGHTAGE_TOTAL_EXCEEDED" ||
          excObj.code === "WEIGHTAGE_TOTAL_INVALID" ||
          excObj.code === "TOPIC_NOT_MAPPED_TO_SECTION"
        ) {
          status = HttpStatus.BAD_REQUEST;
        } else if (excObj.code === "UNAUTHORIZED") {
          status = HttpStatus.UNAUTHORIZED;
        } else if (excObj.code === "FORBIDDEN") {
          status = HttpStatus.FORBIDDEN;
        }
      } else if (excObj.name === "UnauthorizedResultAccessError") {
        errorCode = "FORBIDDEN";
        status = HttpStatus.FORBIDDEN;
        message = "You are not authorized to access this resource";
      } else if (excObj.name === "ResultNotFoundError") {
        errorCode = "NOT_FOUND";
        status = HttpStatus.NOT_FOUND;
        message = "Requested evaluation result was not found";
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const errorObj = exception instanceof Error ? exception : undefined;
      this.logger.error(
        `[SERVER ERROR 💥] [${method}] ${url} - Status: ${status} | Code: ${errorCode} | Message: ${message}`,
        errorObj,
        {
          statusCode: status,
          errorCode,
          errorMessage: message,
          traceId,
          userId,
          method,
          url,
          details,
        },
      );
    } else {
      this.logger.warn(
        `[CLIENT WARN ⚠️] [${method}] ${url} - Status: ${status} | Code: ${errorCode} | Message: ${message}`,
        {
          statusCode: status,
          errorCode,
          errorMessage: message,
          traceId,
          userId,
          method,
          url,
          details,
        },
      );
    }

    // SEC-003: Mask internal server error messages in production to prevent information disclosure
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.NODE_ENV === "staging";
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && isProduction) {
      message =
        "An unexpected internal server error occurred. Please contact support.";
      details = null;
    }

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code: errorCode,
        message,
        details,
      },
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

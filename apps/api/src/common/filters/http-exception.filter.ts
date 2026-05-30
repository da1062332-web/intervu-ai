import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: (request as any).url,
      method: (request as any).method,
      message:
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message
          : exception.message,
      ...(typeof exceptionResponse === 'object' && exceptionResponse),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${(request as any).method}] ${(request as any).url} - ${status}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `[${(request as any).method}] ${(request as any).url} - ${status} - ${exception.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}

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

    let code = 'INTERNAL_SERVER_ERROR';
    let message: any = exception.message;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      code = (exceptionResponse as any).code || (exceptionResponse as any).error || code;
      const msg = (exceptionResponse as any).message;
      if (msg) {
        message = Array.isArray(msg) ? msg[0] : msg;
      }
    }

    if (code === 'INTERNAL_SERVER_ERROR' || !code) {
      if (status === HttpStatus.BAD_REQUEST) code = 'BAD_REQUEST';
      else if (status === HttpStatus.UNAUTHORIZED) code = 'UNAUTHORIZED';
      else if (status === HttpStatus.FORBIDDEN) code = 'FORBIDDEN';
      else if (status === HttpStatus.NOT_FOUND) code = 'NOT_FOUND';
      else if (status === HttpStatus.CONFLICT) code = 'CONFLICT';
    }

    const errorResponse = {
      success: false,
      error: {
        code,
        message,
      },
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

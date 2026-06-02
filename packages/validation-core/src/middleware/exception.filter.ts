import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      
      // If it's already in our standard format, use it
      if (typeof res === 'object' && res.success === false && res.error) {
        return response.status(status).json(res);
      }

      code = typeof res === 'object' && res.error ? res.error : 'HTTP_ERROR';
      message = typeof res === 'object' && res.message ? res.message : exception.message;
      details = res;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details: status === HttpStatus.INTERNAL_SERVER_ERROR ? undefined : details,
      },
    });
  }
}

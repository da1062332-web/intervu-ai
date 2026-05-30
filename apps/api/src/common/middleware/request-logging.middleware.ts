import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: any, res: any, next: () => void) {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();
    const logger = this.logger;

    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      logger.log(
        `[${method}] ${originalUrl} - Status: ${statusCode} - ${duration}ms - IP: ${ip}`,
      );

      return originalSend.call(this, data);
    };

    next();
  }
}

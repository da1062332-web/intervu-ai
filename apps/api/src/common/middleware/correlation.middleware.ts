import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AppLogger } from '@intervu-ai/shared-logger';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  private logger = new AppLogger({ name: 'CorrelationMiddleware' });

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

    req.headers['x-request-id'] = requestId;
    req.headers['x-correlation-id'] = correlationId;
    
    // Setting in response so frontend gets it too
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', correlationId);

    // Provide context to logger if request scoped
    this.logger.setContext({
      requestId,
      correlationId,
      path: req.originalUrl,
      method: req.method,
    });

    next();
  }
}

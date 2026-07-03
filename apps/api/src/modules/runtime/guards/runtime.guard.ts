import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RuntimeSecurityService } from '../services/runtime-security.service';

@Injectable()
export class RuntimeGuard implements CanActivate {
  constructor(private readonly securityService: RuntimeSecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const testId = request.params.testId;

    if (!testId) {
      throw new ForbiddenException('Test ID is required');
    }

    const user = request.user;
    if (user?.role === 'ADMIN') {
      return true;
    }

    return await this.securityService.validateAccess(testId);
  }
}

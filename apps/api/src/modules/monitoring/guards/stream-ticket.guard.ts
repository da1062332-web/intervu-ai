import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { MonitoringStreamTicketService } from "../services/monitoring-stream-ticket.service";

/**
 * Authenticates the live SSE stream with a single-use `?ticket=` issued by
 * POST /admin/monitoring/stream-ticket. The route is @Public() so the global
 * JWT and roles guards skip it — this guard enforces the ADMIN role itself.
 */
@Injectable()
export class StreamTicketGuard implements CanActivate {
  constructor(private readonly ticketService: MonitoringStreamTicketService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = await this.ticketService.redeem(request?.query?.ticket);

    if (!user) {
      throw new UnauthorizedException("Invalid or expired stream ticket");
    }
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Live monitoring stream requires ADMIN role");
    }

    request.user = user;
    return true;
  }
}

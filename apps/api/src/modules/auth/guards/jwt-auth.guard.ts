import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // 1. Check for valid internal service-to-service token (worker -> api)
    if (context.getType() === "http") {
      const request = context.switchToHttp().getRequest();
      const internalToken = request?.headers?.["x-internal-service-token"];
      const expectedToken =
        process.env.INTERNAL_SERVICE_TOKEN || "internal_secret_token";

      if (internalToken && expectedToken && internalToken === expectedToken) {
        request.user = {
          id: "internal-worker",
          email: "worker@internal.service",
          role: "ADMIN",
        };
        return true;
      }
    }

    // 2. Public route handling
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // Try to resolve user from token if present, but don't block if absent or invalid
      try {
        const can = await super.canActivate(context);
        return Boolean(can);
      } catch {
        return true;
      }
    }
    return super.canActivate(context) as Promise<boolean> | boolean;
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    // Allow verified internal worker calls
    if (context.getType() === "http") {
      const request = context.switchToHttp().getRequest();
      if (
        request?.user?.id === "internal-worker" &&
        request?.user?.role === "ADMIN"
      ) {
        return request.user as TUser;
      }
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // On public routes, silently allow even without a valid token
    if (isPublic) {
      return (user || null) as TUser;
    }

    if (err || !user) {
      throw new UnauthorizedException("Invalid or missing access token");
    }

    return user as TUser;
  }
}

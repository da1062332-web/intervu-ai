import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AppConfigService } from "../../../config";
import { UserRepository } from "../../users/repositories/user.repository";
import { AuthUser } from "../interfaces/auth-user.interface";
import { JwtTokenData } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: AppConfigService,
    private readonly userRepository: UserRepository,
  ) {
    const secret =
      configService?.jwtSecret ||
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV !== "production"
        ? "dev_jwt_secret_must_be_at_least_32_chars_long_key_12345"
        : undefined);

    if (!secret) {
      throw new Error(
        "CRITICAL SECURITY CONFIG ERROR: JWT_SECRET environment variable is missing in production!",
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtTokenData): Promise<AuthUser> {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser["role"],
      sessionId: payload.sessionId,
    };
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { UsersService } from "../services/users.service";
 
import { UpdateProfileDto } from "../dto/update-profile.dto";
import {
  ValidateResponse,
  UserResponseSchema,
  SessionListResponseSchema,
} from "@intervu/shared";
import { UserEntity } from "../entities/user.entity";
import { SessionEntity } from "../entities/session.entity";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("users")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.CANDIDATE, UserRole.ADMIN)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ValidateResponse(UserResponseSchema)
  @ApiOperation({ summary: "Get currently authenticated user profile" })
  @ApiOkResponse({
    description: "Current authenticated user profile data",
    type: UserEntity,
  })
  async getMe(@CurrentUser() user: AuthUser): Promise<UserEntity> {
    return this.usersService.getProfile(user.id);
  }

  @Patch("profile")
  @ValidateResponse(UserResponseSchema)
  @ApiOperation({ summary: "Update candidate profile data" })
  @ApiBody({ type: UpdateProfileDto, description: "Profile update data" })
  @ApiOkResponse({
    description: "Updated user profile data",
    type: UserEntity,
  })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserEntity> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get("sessions")
  @ValidateResponse(SessionListResponseSchema)
  @ApiOperation({ summary: "List all active user sessions" })
  @ApiOkResponse({
    description: "List of active user sessions",
    type: [SessionEntity],
  })
  async getSessions(@CurrentUser() user: AuthUser): Promise<SessionEntity[]> {
    return this.usersService.getSessions(user.id, user.sessionId);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke/terminate a specific session" })
  async terminateSession(
    @CurrentUser() user: AuthUser,
    @Param("id") sessionId: string,
  ): Promise<void> {
    await this.usersService.terminateSession(sessionId, user.id);
  }

  @Delete("sessions")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Terminate all other active sessions (logout multi-device)",
  })
  async terminateOtherSessions(@CurrentUser() user: AuthUser): Promise<void> {
    await this.usersService.terminateAllOtherSessions(user.id, user.sessionId);
  }
}

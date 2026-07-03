import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { CandidateProfileService } from "../services/candidate-profile.service";
import {
  CandidateProfileResponseDto,
  UpdateCandidateProfileDto,
} from "../dto/candidate-profile.dto";

@ApiTags("candidate-profile")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@Controller("candidate/profile")
export class CandidateProfileController {
  constructor(private readonly profileService: CandidateProfileService) {}

  @Get()
  @ApiOperation({ summary: "Get candidate profile" })
  @ApiOkResponse({ type: CandidateProfileResponseDto })
  async getProfile(
    @CurrentUser() user: AuthUser,
  ): Promise<CandidateProfileResponseDto> {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  @ApiOperation({ summary: "Update candidate profile" })
  @ApiBody({ type: UpdateCandidateProfileDto })
  @ApiOkResponse({ type: CandidateProfileResponseDto })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfileResponseDto> {
    return this.profileService.updateProfile(user.id, dto);
  }
}

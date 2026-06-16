import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthUser } from "@/modules/auth/interfaces/auth-user.interface";
import { ExecutionService } from "../services/execution.service";

import { Roles } from "@/modules/auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE)
@Controller("tests")
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Load an assessment snapshot" })
  @ApiParam({ name: "id", type: "string", description: "The test instance ID" })
  @ApiResponse({
    status: 200,
    description: "Assessment loaded successfully",
  })
  @ApiResponse({ status: 404, description: "Assessment not found" })
  async loadAssessment(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return this.executionService.loadAssessment(id, user.id);
  }
}

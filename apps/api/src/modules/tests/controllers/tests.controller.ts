import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TestsService } from "../services/tests.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
// eslint-disable-next-line no-restricted-imports
import { TestConfigsResponseDto } from "../dto/available-config.dto";

@ApiTags("tests")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.CANDIDATE)
@Controller("tests")
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  /**
   * GET /api/v1/tests/configs
   *
   * Config discovery endpoint — allows the candidate dashboard and future
   * test-selection screens to enumerate available assessments.
   *
   * No request body or query params required.
   * The response is wrapped in the standard envelope by ResponseInterceptor.
   */
  @Get("configs")
  @ApiOperation({
    summary: "Discover available test configurations",
    description:
      "Returns all active assessment templates that a candidate can start. " +
      "Used by the dashboard and test-selection screens.",
    operationId: "getAvailableConfigs",
  })
  @ApiOkResponse({
    description: "List of available test configurations retrieved successfully",
    type: TestConfigsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT bearer token",
  })
  async getAvailableConfigs(): Promise<TestConfigsResponseDto> {
    return this.testsService.getAvailableConfigs();
  }
}

import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { RuleFlagsService } from "../services/rule-flags.service";
import {
  RuleFlagsResponseSchema,
  ValidateResponse,
  UpdateRuleFlagsDto,
} from "@intervu/shared";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("admin-configs-rule-flags")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/configs/:configId/rule-flags")
export class RuleFlagsController {
  constructor(private readonly ruleFlagsService: RuleFlagsService) {}

  @Get()
  @ValidateResponse(RuleFlagsResponseSchema)
  @ApiOperation({ summary: "Get rule flags for an exam config" })
  @ApiParam({ name: "configId", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Rule flags retrieved successfully" })
  async getRuleFlags(@Param("configId") configId: string) {
    return this.ruleFlagsService.getRuleFlags(configId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(RuleFlagsResponseSchema)
  @ApiOperation({ summary: "Update rule flags for an exam config" })
  @ApiParam({ name: "configId", description: "Exam configuration ID" })
  @ApiBody({ type: UpdateRuleFlagsDto })
  @ApiOkResponse({ description: "Rule flags updated successfully" })
  async updateRuleFlags(
    @Param("configId") configId: string,
    @Body() body: UpdateRuleFlagsDto,
  ) {
    return this.ruleFlagsService.updateRuleFlags(configId, body);
  }
}

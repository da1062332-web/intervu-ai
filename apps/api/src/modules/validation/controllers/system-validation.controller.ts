import {
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { CrossModuleValidatorService } from "../services/cross-module-validator.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { ValidateResponse } from "@intervu/shared";
import { SystemValidationResponseSchema } from "@intervu-ai/contracts";

@ApiTags("system-validation")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("system")
export class SystemValidationController {
  constructor(private readonly validatorService: CrossModuleValidatorService) {}

  @Post("validate-config/:configId")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(SystemValidationResponseSchema)
  @ApiOperation({
    summary: "Run cross-module validation for an exam configuration",
  })
  @ApiParam({ name: "configId", description: "Exam configuration ID" })
  @ApiOkResponse({
    description: "Cross-module validation ran successfully",
  })
  async validateConfig(@Param("configId") configId: string) {
    const result =
      await this.validatorService.validateGenerationPrerequisites(configId);
    return {
      valid: result.valid,
      score: result.score,
      errors: result.errors,
      breakdown: result.breakdown,
    };
  }
}

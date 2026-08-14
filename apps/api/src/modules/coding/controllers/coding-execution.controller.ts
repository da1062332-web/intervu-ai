import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { RunCodeDto } from "../dto/run-code.dto";
import { CodingExecutionService } from "../services/coding-execution.service";

import { SubmitCodeDto } from "../dto/submit-code.dto";

@ApiTags("coding")
@Controller("coding")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE, UserRole.ADMIN)
export class CodingExecutionController {
  constructor(
    private readonly codingExecutionService: CodingExecutionService,
  ) {}

  @Post("run")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Execute candidate code against public test cases only via Judge0",
    description:
      "Submits candidate source code to self-hosted Judge0 for public test evaluation. Never exposes hidden, boundary, or stress test cases.",
  })
  @ApiResponse({
    status: 200,
    description: "Public test execution completed successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid code request or unsupported language" })
  @ApiResponse({ status: 403, description: "Forbidden assessment session access" })
  @ApiResponse({ status: 404, description: "Question or assessment session not found" })
  async runCode(
    @Body() dto: RunCodeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.codingExecutionService.runPublicTests(dto, user);
  }

  @Post("submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Submit candidate code for Phase 5 full server-side evaluation",
    description:
      "Evaluates candidate solution against Public, Hidden, Boundary, and Stress test suites server-side using Judge0 & Oracle expected output. Returns candidate-safe evaluation summary.",
  })
  @ApiResponse({
    status: 200,
    description: "Full coding evaluation completed successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid code request or unsupported language" })
  @ApiResponse({ status: 403, description: "Forbidden assessment session access" })
  @ApiResponse({ status: 404, description: "Question or assessment session not found" })
  async submitCode(
    @Body() dto: SubmitCodeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.codingExecutionService.submitFullEvaluation(dto, user);
  }
}

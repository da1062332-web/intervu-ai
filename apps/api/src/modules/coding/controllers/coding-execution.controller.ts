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
import { RateLimitCategory } from "../../../common/decorators/rate-limit.decorator";
import { RunCodeDto, RunCodeResponseDto } from "../dto/run-code.dto";
import { CodeExecutionQueueService } from "../services/code-execution-queue.service";

import { SubmitCodeDto, SubmitCodeResponseDto } from "../dto/submit-code.dto";

// "run" executes only public tests and is used repeatedly while a candidate
// iterates on their solution; "submit" runs the full public+hidden+boundary+
// stress suite and is meaningfully slower, so it gets a longer budget.
const RUN_TIMEOUT_MS = 45_000;
const SUBMIT_TIMEOUT_MS = 120_000;

@ApiTags("coding")
@Controller("coding")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE, UserRole.ADMIN)
export class CodingExecutionController {
  constructor(
    private readonly codeExecutionQueueService: CodeExecutionQueueService,
  ) {}

  @Post("run")
  @HttpCode(HttpStatus.OK)
  @RateLimitCategory("assessment")
  @ApiOperation({
    summary: "Execute candidate code against public test cases only via Judge0",
    description:
      "Enqueues candidate source code onto the bounded-concurrency code-execution queue for public test evaluation. Never exposes hidden, boundary, or stress test cases.",
  })
  @ApiResponse({
    status: 200,
    description: "Public test execution completed successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid code request or unsupported language" })
  @ApiResponse({ status: 403, description: "Forbidden assessment session access" })
  @ApiResponse({ status: 404, description: "Question or assessment session not found" })
  @ApiResponse({ status: 503, description: "Execution engine at capacity, retry shortly" })
  async runCode(
    @Body() dto: RunCodeDto,
    @CurrentUser() user: AuthUser,
  ): Promise<RunCodeResponseDto> {
    return this.codeExecutionQueueService.execute<RunCodeResponseDto>(
      "run",
      dto,
      user,
      RUN_TIMEOUT_MS,
    );
  }

  @Post("submit")
  @HttpCode(HttpStatus.OK)
  @RateLimitCategory("submission")
  @ApiOperation({
    summary: "Submit candidate code for Phase 5 full server-side evaluation",
    description:
      "Enqueues candidate solution onto the bounded-concurrency code-execution queue for Public, Hidden, Boundary, and Stress test evaluation via Judge0 & Oracle expected output. Returns candidate-safe evaluation summary.",
  })
  @ApiResponse({
    status: 200,
    description: "Full coding evaluation completed successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid code request or unsupported language" })
  @ApiResponse({ status: 403, description: "Forbidden assessment session access" })
  @ApiResponse({ status: 404, description: "Question or assessment session not found" })
  @ApiResponse({ status: 503, description: "Execution engine at capacity, retry shortly" })
  async submitCode(
    @Body() dto: SubmitCodeDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SubmitCodeResponseDto> {
    return this.codeExecutionQueueService.execute<SubmitCodeResponseDto>(
      "submit",
      dto,
      user,
      SUBMIT_TIMEOUT_MS,
    );
  }
}

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam } from "@nestjs/swagger";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { ExecutionService } from "../services/execution.service";
import { SubmitExecutionDto, SubmitExecutionResponseDto, ExecutionResultDto } from "@/modules/execution/dto";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Controller("execution")
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post("submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit answers for a test execution" })
  @ApiBody({ type: SubmitExecutionDto })
  @ApiResponse({ status: 200, type: SubmitExecutionResponseDto, description: "Test execution successfully submitted" })
  @ApiResponse({ status: 400, description: "Invalid payload or empty answers" })
  @ApiResponse({ status: 409, description: "Execution for this test already submitted" })
  @ApiResponse({ status: 503, description: "Persistence layer unavailable" })
  async submitTest(@Body() dto: SubmitExecutionDto): Promise<SubmitExecutionResponseDto> {
    return this.executionService.submitAnswers(dto);
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get the result of a test execution" })
  @ApiParam({ name: "id", type: "string", description: "The execution ID" })
  @ApiResponse({ status: 200, type: ExecutionResultDto, description: "Test execution result fetched successfully" })
  @ApiResponse({ status: 404, description: "Execution not found" })
  async getExecutionResult(@Param("id") id: string): Promise<ExecutionResultDto> {
    return this.executionService.getExecutionResult(id);
  }
}

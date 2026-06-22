import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";

import { GenerationContextService } from "../services/generation-context.service";
import { GenerationOrchestratorService } from "../services/generation-orchestrator.service";
import { GenerationRequestDto, ApiResponseDto } from "../dto/generation.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("generation")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("generation")
export class GenerationController {
  constructor(
    private readonly contextService: GenerationContextService,
    private readonly orchestratorService: GenerationOrchestratorService,
  ) {}

  @Get("context/:examId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resolve and build the complete generation context for an exam",
  })
  @ApiParam({
    name: "examId",
    example: "cuid12345",
    description: "Exam configuration ID",
  })
  @ApiOkResponse({ description: "Generation context resolved successfully" })
  async getContext(@Param("examId") examId: string): Promise<ApiResponseDto> {
    const result = await this.contextService.loadContext(examId);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("questions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Generate questions through the complete core orchestration flow",
  })
  @ApiBody({
    type: GenerationRequestDto,
    description: "Generation parameters",
  })
  @ApiCreatedResponse({
    description: "Questions generated and validated successfully",
  })
  async generateQuestions(
    @Body() dto: GenerationRequestDto,
  ): Promise<ApiResponseDto> {
    const result = await this.orchestratorService.generateBatch(dto);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("questions/:id/regenerate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Regenerate a specific question using similar properties",
  })
  @ApiParam({
    name: "id",
    description: "Question ID to regenerate",
  })
  @ApiOkResponse({ description: "Question regenerated successfully" })
  async regenerateQuestion(@Param("id") id: string): Promise<ApiResponseDto> {
    const result = await this.orchestratorService.regenerateQuestion(id);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}

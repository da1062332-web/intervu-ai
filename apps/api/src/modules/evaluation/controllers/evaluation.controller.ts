import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ValidateResponse } from "@intervu/shared";
import { z } from "zod";
import { EvaluationService } from "../services/evaluation.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("evaluation")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.CANDIDATE)
@Controller("evaluation")
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post(":answerId/evaluate")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Trigger evaluation for an answer" })
  async evaluateAnswer(@Param("answerId") answerId: string) {
    return this.evaluationService.evaluateAnswer(answerId);
  }

  @Get(":answerId")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Get evaluation result" })
  async getEvaluation(@Param("answerId") answerId: string) {
    return this.evaluationService.getEvaluation(answerId);
  }
}

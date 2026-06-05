import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ValidateResponse } from "@intervu/shared";
import { z } from "zod";
import { EvaluationService } from "../services/evaluation.service";

@ApiTags("evaluation")
@ApiBearerAuth("jwt-auth")
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

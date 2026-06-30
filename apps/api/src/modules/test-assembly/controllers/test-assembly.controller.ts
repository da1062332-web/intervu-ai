import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateTestRequest,
  GenerationRequest,
  EvaluationRequest,
} from "@intervu-ai/contracts";
import { z } from "zod";
import { ValidateResponse } from "@intervu/shared";

import { TestAssemblyService } from "../services/test-assembly.service";

@Controller("test-assemblies")
export class TestAssemblyController {
  constructor(private readonly testAssemblyService: TestAssemblyService) {}

  @Get(":id")
  @ValidateResponse(z.unknown())
  async getTest(@Param("id") id: string) {
    const test = await this.testAssemblyService.getTest(id);
    if (!test) {
      throw new NotFoundException("Test not found");
    }
    return test;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(z.unknown())
  async createTest(@Body() body: CreateTestRequest) {
    // The ZodValidationPipe will automatically enforce that body is CreateTestRequestDto
    return {
      testId: "test_123",
      companyId: body.companyId,
      testType: body.testType,
    };
  }

  @Post("questions/generate")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  async generateQuestions(@Body() body: GenerationRequest) {
    return this.testAssemblyService.generateQuestions(body);
  }

  @Post("evaluate")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  async evaluateAnswer(@Body() body: EvaluationRequest) {
    return {
      answerId: body.answerId,
      score: 85,
      feedback: "Good answer.",
    };
  }
}

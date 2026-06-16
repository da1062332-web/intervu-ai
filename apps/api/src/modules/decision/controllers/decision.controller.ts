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
import { DecisionService } from "../services/decision.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("decision")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("decision")
export class DecisionController {
  constructor(private readonly decisionService: DecisionService) {}

  @Post(":testId/make")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Make a final decision for a completed test" })
  async makeDecision(@Param("testId") testId: string) {
    return this.decisionService.makeDecision(testId);
  }

  @Get(":testId")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Get decision result for a test" })
  async getDecision(@Param("testId") testId: string) {
    return this.decisionService.getDecision(testId);
  }
}

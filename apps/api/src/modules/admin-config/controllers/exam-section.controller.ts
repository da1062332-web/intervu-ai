import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { ExamSectionService } from "../services/exam-section.service";
import {
  CreateExamSectionDto,
  UpdateExamSectionDto,
  ExamSectionResponseSchema,
  ExamSectionListResponseSchema,
} from "@intervu/shared";
import { ValidateResponse } from "@intervu/shared";

@ApiTags("admin/sections")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class ExamSectionController {
  constructor(private readonly sectionService: ExamSectionService) {}

  @Post("configs/:configId/sections")
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(ExamSectionResponseSchema)
  @ApiOperation({ summary: "Create a new section configuration under an exam" })
  async createSection(
    @Param("configId") configId: string,
    @Body() dto: CreateExamSectionDto,
  ) {
    return this.sectionService.createSection(configId, dto);
  }

  @Get("configs/:configId/sections")
  @ValidateResponse(ExamSectionListResponseSchema)
  @ApiOperation({ summary: "List sections under an exam configuration" })
  async getSections(@Param("configId") configId: string) {
    return this.sectionService.getSections(configId);
  }

  @Patch("sections/:sectionId")
  @ValidateResponse(ExamSectionResponseSchema)
  @ApiOperation({ summary: "Update an existing section configuration" })
  async updateSection(
    @Param("sectionId") sectionId: string,
    @Body() dto: UpdateExamSectionDto,
  ) {
    return this.sectionService.updateSection(sectionId, dto);
  }

  @Delete("sections/:sectionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a section configuration" })
  async deleteSection(@Param("sectionId") sectionId: string) {
    await this.sectionService.deleteSection(sectionId);
    return { success: true };
  }
}

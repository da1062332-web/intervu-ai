import { Controller, Get, Post, Put, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { PromptManagerService } from "../prompts/prompt-manager.service";
import { CreatePromptDto, UpdatePromptDto } from "../dto/prompt.dto";

@ApiTags("Prompts")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("prompts")
export class PromptsController {
  constructor(private readonly promptManager: PromptManagerService) {}

  @Get()
  @ApiOperation({ summary: "Get all prompt templates and versions" })
  async listPrompts() {
    return this.promptManager.listPrompts();
  }

  @Post()
  @ApiOperation({ summary: "Create a new prompt template version" })
  @ApiCreatedResponse({ description: "Prompt version created successfully" })
  async createPrompt(@Body() dto: CreatePromptDto) {
    return this.promptManager.createPrompt(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an existing prompt template version" })
  @ApiOkResponse({ description: "Prompt updated successfully" })
  async updatePrompt(@Param("id") id: string, @Body() dto: UpdatePromptDto) {
    return this.promptManager.updatePrompt(id, dto);
  }
}

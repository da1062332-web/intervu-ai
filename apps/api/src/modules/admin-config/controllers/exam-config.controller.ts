import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
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
import { ExamConfigService } from "../services/exam-config.service";
import {
  CreateExamConfigDto,
  ValidateResponse,
  ExamConfigResponseSchema,
  ExamConfigListResponseSchema,
  UpdateExamConfigDto,
} from "@intervu/shared";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("admin-configs")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/configs")
export class ExamConfigController {
  constructor(private readonly examConfigService: ExamConfigService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(ExamConfigResponseSchema)
  @ApiOperation({ summary: "Create a new exam configuration" })
  @ApiBody({ type: CreateExamConfigDto })
  @ApiCreatedResponse({ description: "Configuration created successfully" })
  async create(
    @Body() dto: CreateExamConfigDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examConfigService.create(dto, user.id);
  }

  @Get()
  @ValidateResponse(ExamConfigListResponseSchema)
  @ApiOperation({ summary: "List all active exam configurations" })
  @ApiOkResponse({ description: "List of configurations" })
  async findAll() {
    return this.examConfigService.findAll();
  }

  @Patch(":id")
  @ValidateResponse(ExamConfigResponseSchema)
  @ApiOperation({ summary: "Update an exam configuration" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiBody({ type: UpdateExamConfigDto })
  @ApiOkResponse({ description: "Configuration updated successfully" })
  async update(@Param("id") id: string, @Body() dto: UpdateExamConfigDto) {
    return this.examConfigService.update(id, dto);
  }

  @Get(":id")
  @ValidateResponse(ExamConfigResponseSchema)
  @ApiOperation({ summary: "Get a single exam configuration by ID" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Configuration details" })
  async findOne(@Param("id") id: string) {
    return this.examConfigService.findOne(id);
  }
}

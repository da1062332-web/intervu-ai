import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { StyleProfileService } from "../services/style-profile.service";
import { CreateStyleProfileDto, UpdateStyleProfileDto } from "@intervu/shared";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("style-profiles")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("style-profiles")
export class StyleProfileController {
  constructor(private readonly service: StyleProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new style profile" })
  @ApiBody({ type: CreateStyleProfileDto })
  @ApiCreatedResponse({ description: "Style profile created successfully" })
  async create(@Body() dto: CreateStyleProfileDto) {
    const profile = await this.service.create(dto);
    return {
      success: true,
      data: profile,
      error: null,
      meta: {},
    };
  }

  @Get()
  @ApiOperation({ summary: "List all style profiles" })
  @ApiOkResponse({ description: "List of style profiles" })
  async findAll() {
    const profiles = await this.service.findAll();
    return {
      success: true,
      data: profiles,
      error: null,
      meta: {},
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single style profile by ID" })
  @ApiParam({ name: "id", description: "Style profile ID" })
  @ApiOkResponse({ description: "Style profile details" })
  async findOne(@Param("id") id: string) {
    const profile = await this.service.findOne(id);
    return {
      success: true,
      data: profile,
      error: null,
      meta: {},
    };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a style profile" })
  @ApiParam({ name: "id", description: "Style profile ID" })
  @ApiBody({ type: UpdateStyleProfileDto })
  @ApiOkResponse({ description: "Style profile updated successfully" })
  async update(@Param("id") id: string, @Body() dto: UpdateStyleProfileDto) {
    const profile = await this.service.update(id, dto);
    return {
      success: true,
      data: profile,
      error: null,
      meta: {},
    };
  }
}

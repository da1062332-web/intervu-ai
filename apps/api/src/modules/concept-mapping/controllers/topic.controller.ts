import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserRole } from "@prisma/client";
import { TopicService } from "../services/topic.service";
import {
  CreateTopicDto,
  UpdateTopicDto,
  TopicResponseSchema,
  TopicListResponseSchema,
  ValidateResponse,
} from "@intervu/shared";

@ApiTags("admin/topics")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/topics")
export class TopicController {
  constructor(private readonly service: TopicService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(TopicResponseSchema)
  @ApiOperation({ summary: "Create a new topic" })
  @ApiCreatedResponse({ description: "Topic created successfully" })
  async createTopic(@Body() dto: CreateTopicDto) {
    return this.service.createTopic(dto);
  }

  @Get()
  @ValidateResponse(TopicListResponseSchema)
  @ApiOperation({ summary: "List all active topics" })
  @ApiOkResponse({ description: "List of active topics" })
  async getTopics(@Query("activeOnly") activeOnly?: string) {
    const filterActive = activeOnly !== "false";
    return this.service.getTopics(filterActive);
  }

  @Get(":id")
  @ValidateResponse(TopicResponseSchema)
  @ApiOperation({ summary: "Get a single topic by ID" })
  @ApiOkResponse({ description: "Topic details" })
  async getTopic(@Param("id") id: string) {
    return this.service.getTopic(id);
  }

  @Patch(":id")
  @ValidateResponse(TopicResponseSchema)
  @ApiOperation({ summary: "Update an existing topic" })
  @ApiOkResponse({ description: "Topic updated successfully" })
  async updateTopic(@Param("id") id: string, @Body() dto: UpdateTopicDto) {
    return this.service.updateTopic(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete a topic (deactivates it)" })
  @ApiOkResponse({ description: "Topic deactivated successfully" })
  async deleteTopic(@Param("id") id: string) {
    return this.service.deleteTopic(id);
  }
}

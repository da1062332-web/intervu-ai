import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { TopicSectionMappingService } from "../services/topic-section-mapping.service";
import { CreateSectionTopicDto } from "../dto/create-section-topic.dto";
import { SectionTopicListResponse } from "@intervu-ai/contracts";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Section Topics")
@ApiBearerAuth()
@Controller("api/v1/admin/sections/:sectionId/topics")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TopicSectionMappingController {
  constructor(private readonly service: TopicSectionMappingService) {}

  @Get()
  @ApiOperation({ summary: "Get all mapped topics for a section" })
  async getMappings(
    @Param("sectionId") sectionId: string,
  ): Promise<SectionTopicListResponse> {
    const data = await this.service.getMappings(sectionId);
    return {
      success: true,
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: "Map a topic to a section" })
  async assignTopic(
    @Param("sectionId") sectionId: string,
    @Body() dto: CreateSectionTopicDto,
  ) {
    await this.service.assignTopic(sectionId, dto.topicId);
    return {
      success: true,
      data: {},
    };
  }

  @Delete(":topicId")
  @ApiOperation({ summary: "Remove a topic mapping from a section" })
  async removeTopic(
    @Param("sectionId") sectionId: string,
    @Param("topicId") topicId: string,
  ) {
    await this.service.removeTopic(sectionId, topicId);
    return {
      success: true,
    };
  }
}

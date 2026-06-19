import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { TopicWeightageService } from "../services/topic-weightage.service";
import {
  CreateTopicWeightageDto,
  UpdateTopicWeightageDto,
} from "@intervu/shared";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Topic Weightages")
@ApiBearerAuth()
@Controller("admin")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TopicWeightageController {
  constructor(private readonly service: TopicWeightageService) {}

  @Post("sections/:sectionId/weightages")
  @ApiOperation({ summary: "Assign weightage to a mapped topic" })
  async addWeightage(
    @Param("sectionId") sectionId: string,
    @Body() dto: CreateTopicWeightageDto,
  ) {
    const data = await this.service.addWeightage(
      sectionId,
      dto.topicId,
      dto.weightagePercentage,
    );
    return {
      success: true,
      data,
    };
  }

  @Get("sections/:sectionId/weightages")
  @ApiOperation({ summary: "Get all weightages for a section" })
  async getWeightages(@Param("sectionId") sectionId: string) {
    const data = await this.service.getWeightages(sectionId);
    return {
      success: true,
      data,
    };
  }

  @Patch("weightages/:id")
  @ApiOperation({ summary: "Update topic weightage configuration" })
  async updateWeightage(
    @Param("id") id: string,
    @Body() dto: UpdateTopicWeightageDto,
  ) {
    const data = await this.service.updateWeightage(
      id,
      dto.weightagePercentage,
    );
    return {
      success: true,
      data,
    };
  }

  @Delete("weightages/:id")
  @ApiOperation({ summary: "Delete topic weightage configuration" })
  async deleteWeightage(@Param("id") id: string) {
    await this.service.deleteWeightage(id);
    return {
      success: true,
      data: null,
    };
  }
}

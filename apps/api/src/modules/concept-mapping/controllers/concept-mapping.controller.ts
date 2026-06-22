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
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { UserRole } from "@prisma/client";
import { ConceptMappingService } from "../services/concept-mapping.service";
import {
  CreateConceptMappingDto,
  UpdateConceptMappingDto,
  ConceptMappingResponseSchema,
  ConceptMappingListResponseSchema,
} from "@intervu/shared";
import { ValidateResponse } from "@intervu/shared";

@ApiTags("admin/concepts")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class ConceptMappingController {
  constructor(private readonly service: ConceptMappingService) {}

  @Post("topics/:topicId/concepts")
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(ConceptMappingResponseSchema)
  @ApiOperation({ summary: "Create a new concept mapping under a topic" })
  async createConcept(
    @Param("topicId") topicId: string,
    @Body() dto: CreateConceptMappingDto,
  ) {
    return this.service.createConcept(topicId, dto);
  }

  @Get("topics/:topicId/concepts")
  @ValidateResponse(ConceptMappingListResponseSchema)
  @ApiOperation({ summary: "List active concepts under a topic" })
  async getConcepts(
    @Param("topicId") topicId: string,
    @Query("activeOnly") activeOnly?: string,
  ) {
    const filterActive = activeOnly !== "false";
    return this.service.getConcepts(topicId, filterActive);
  }

  @Patch("concepts/:conceptId")
  @ValidateResponse(ConceptMappingResponseSchema)
  @ApiOperation({ summary: "Update an existing concept mapping" })
  async updateConcept(
    @Param("conceptId") conceptId: string,
    @Body() dto: UpdateConceptMappingDto,
  ) {
    return this.service.updateConcept(conceptId, dto);
  }

  @Delete("concepts/:conceptId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete a concept mapping (deactivates it)" })
  async deleteConcept(@Param("conceptId") conceptId: string) {
    await this.service.deleteConcept(conceptId);
    return { success: true };
  }
}

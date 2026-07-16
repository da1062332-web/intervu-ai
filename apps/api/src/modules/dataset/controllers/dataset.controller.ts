import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { UserRole } from "@prisma/client";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { DatasetService } from "../services/dataset.service";
import {
  CreateDatasetDto,
  UpdateDatasetDto,
  CreateDatasetItemDto,
  UpdateDatasetItemDto,
} from "../dto/dataset.dto";

@ApiTags("datasets")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("datasets")
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new dataset" })
  @ApiBody({ type: CreateDatasetDto })
  @ApiCreatedResponse({ description: "Dataset created successfully" })
  async create(@Body() dto: CreateDatasetDto) {
    return this.datasetService.createDataset(dto);
  }

  @Get()
  @ApiOperation({ summary: "List all datasets" })
  @ApiOkResponse({ description: "List of datasets" })
  async findAll() {
    return this.datasetService.findAllDatasets();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a dataset by ID, including all items" })
  @ApiParam({ name: "id", description: "Dataset ID" })
  @ApiOkResponse({ description: "Dataset record with items" })
  async findOne(@Param("id") id: string) {
    return this.datasetService.findDatasetById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a dataset details" })
  @ApiParam({ name: "id", description: "Dataset ID" })
  @ApiBody({ type: UpdateDatasetDto })
  @ApiOkResponse({ description: "Dataset updated successfully" })
  async update(@Param("id") id: string, @Body() dto: UpdateDatasetDto) {
    return this.datasetService.updateDataset(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a dataset by ID" })
  @ApiParam({ name: "id", description: "Dataset ID" })
  @ApiOkResponse({ description: "Dataset deleted successfully" })
  async remove(@Param("id") id: string) {
    return this.datasetService.deleteDataset(id);
  }

  @Post(":id/items")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a single content item to a dataset" })
  @ApiParam({ name: "id", description: "Dataset ID" })
  @ApiBody({ type: CreateDatasetItemDto })
  @ApiCreatedResponse({ description: "Item added successfully" })
  async addItem(@Param("id") id: string, @Body() dto: CreateDatasetItemDto) {
    return this.datasetService.addDatasetItem(id, dto);
  }

  @Post(":id/items/bulk")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add multiple content items to a dataset in bulk" })
  @ApiParam({ name: "id", description: "Dataset ID" })
  @ApiBody({ type: [CreateDatasetItemDto] })
  @ApiCreatedResponse({ description: "Items added successfully" })
  async addItemsBulk(
    @Param("id") id: string,
    @Body() dtos: CreateDatasetItemDto[],
  ) {
    return this.datasetService.addDatasetItemsBulk(id, dtos);
  }

  @Delete("items/:itemId")
  @ApiOperation({ summary: "Remove a specific dataset item" })
  @ApiParam({ name: "itemId", description: "Dataset Item ID" })
  @ApiOkResponse({ description: "Item removed successfully" })
  async removeItem(@Param("itemId") itemId: string) {
    return this.datasetService.deleteDatasetItem(itemId);
  }

  @Get("items/:itemId")
  @ApiOperation({ summary: "Get details of a single dataset item" })
  @ApiParam({ name: "itemId", description: "Dataset Item ID" })
  @ApiOkResponse({ description: "Dataset item details" })
  async findItem(@Param("itemId") itemId: string) {
    return this.datasetService.findDatasetItemById(itemId);
  }

  @Patch("items/:itemId")
  @ApiOperation({ summary: "Update specific properties of a dataset item" })
  @ApiParam({ name: "itemId", description: "Dataset Item ID" })
  @ApiBody({ type: UpdateDatasetItemDto })
  @ApiOkResponse({ description: "Item updated successfully" })
  async updateItem(
    @Param("itemId") itemId: string,
    @Body() dto: UpdateDatasetItemDto,
  ) {
    return this.datasetService.updateDatasetItem(itemId, dto);
  }

  @Get(":id/schema")
  @ApiOperation({ summary: "Get inferred schema properties of a dataset" })
  @ApiParam({ name: "id", description: "Dataset ID" })
  @ApiOkResponse({ description: "Dataset schema representation" })
  async getSchema(@Param("id") id: string) {
    return this.datasetService.getDatasetSchema(id);
  }
}

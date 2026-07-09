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
import { ScenarioService } from "../services/scenario.service";
import { CreateScenarioDto, UpdateScenarioDto } from "../dto/scenario.dto";

@ApiTags("scenarios")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("scenarios")
export class ScenarioController {
  constructor(private readonly scenarioService: ScenarioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new logic scenario template" })
  @ApiBody({ type: CreateScenarioDto })
  @ApiCreatedResponse({ description: "Scenario created successfully" })
  async create(@Body() dto: CreateScenarioDto) {
    return this.scenarioService.createScenario(dto);
  }

  @Get()
  @ApiOperation({ summary: "List all logic scenario templates" })
  @ApiOkResponse({ description: "List of scenarios" })
  async findAll() {
    return this.scenarioService.findAllScenarios();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a logic scenario template by ID" })
  @ApiParam({ name: "id", description: "Scenario ID" })
  @ApiOkResponse({ description: "Scenario record" })
  async findOne(@Param("id") id: string) {
    return this.scenarioService.findScenarioById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update scenario rules/schemas" })
  @ApiParam({ name: "id", description: "Scenario ID" })
  @ApiBody({ type: UpdateScenarioDto })
  @ApiOkResponse({ description: "Scenario updated successfully" })
  async update(@Param("id") id: string, @Body() dto: UpdateScenarioDto) {
    return this.scenarioService.updateScenario(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a scenario template by ID" })
  @ApiParam({ name: "id", description: "Scenario ID" })
  @ApiOkResponse({ description: "Scenario deleted successfully" })
  async remove(@Param("id") id: string) {
    return this.scenarioService.deleteScenario(id);
  }
}

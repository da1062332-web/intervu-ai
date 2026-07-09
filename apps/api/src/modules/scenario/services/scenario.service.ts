import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateScenarioDto, UpdateScenarioDto } from "../dto/scenario.dto";

@Injectable()
export class ScenarioService {
  constructor(private readonly prismaService: PrismaService) {}

  async createScenario(dto: CreateScenarioDto) {
    return this.prismaService.scenario.create({
      data: {
        name: dto.name,
        description: dto.description,
        entitySchema: dto.entitySchema,
        relationSchema: dto.relationSchema,
        rules: dto.rules || {},
      },
    });
  }

  async findAllScenarios() {
    return this.prismaService.scenario.findMany();
  }

  async findScenarioById(id: string) {
    const scenario = await this.prismaService.scenario.findUnique({
      where: { id },
    });
    if (!scenario) {
      throw new NotFoundException(`Scenario with ID "${id}" not found`);
    }
    return scenario;
  }

  async updateScenario(id: string, dto: UpdateScenarioDto) {
    await this.findScenarioById(id); // ensure exists
    return this.prismaService.scenario.update({
      where: { id },
      data: dto,
    });
  }

  async deleteScenario(id: string) {
    await this.findScenarioById(id); // ensure exists
    return this.prismaService.scenario.delete({
      where: { id },
    });
  }
}

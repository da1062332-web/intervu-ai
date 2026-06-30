import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { GenerationTemplate, Prisma } from "@prisma/client";

@Injectable()
export class TemplateLibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplate(id: string): Promise<GenerationTemplate> {
    const template = await this.prisma.generationTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async getTemplateByCategory(category: string): Promise<GenerationTemplate> {
    const template = await this.prisma.generationTemplate.findFirst({
      where: { category, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (!template) {
      throw new NotFoundException(`Active template for category "${category}" not found`);
    }
    return template;
  }

  async listTemplates(): Promise<GenerationTemplate[]> {
    return this.prisma.generationTemplate.findMany({
      orderBy: { name: "asc" },
    });
  }

  async createTemplate(data: {
    name: string;
    category: string;
    schema: any;
  }): Promise<GenerationTemplate> {
    return this.prisma.generationTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        schema: data.schema as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }

  async updateTemplate(
    id: string,
    data: { name?: string; schema?: any; isActive?: boolean },
  ): Promise<GenerationTemplate> {
    const existing = await this.prisma.generationTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return this.prisma.generationTemplate.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        schema: data.schema !== undefined ? (data.schema as Prisma.InputJsonValue) : (existing.schema as Prisma.InputJsonValue),
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });
  }
}

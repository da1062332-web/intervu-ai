import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
// import { GenerationPrompt } from "@prisma/client";
type GenerationPrompt = any;
@Injectable()
export class PromptManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async listPrompts(): Promise<GenerationPrompt[]> {
<<<<<<< HEAD
    return (this.prisma as any).generationPrompt.findMany({
=======
    return this.prisma.generationPrompt.findMany({
>>>>>>> df114762eb99866ba825edb9aff504802cb730eb
      orderBy: [{ name: "asc" }, { version: "desc" }],
    });
  }

  async getPrompt(id: string): Promise<GenerationPrompt> {
    const prompt = await (this.prisma as any).generationPrompt.findUnique({
      where: { id },
    });
    if (!prompt) {
      throw new NotFoundException(`Prompt with ID ${id} not found`);
    }
    return prompt;
  }

  async getPromptByName(name: string): Promise<GenerationPrompt> {
    const prompt = await (this.prisma as any).generationPrompt.findFirst({
      where: { name, isActive: true },
      orderBy: { version: "desc" },
    });
    if (!prompt) {
      throw new NotFoundException(
        `Active prompt with name "${name}" not found`,
      );
    }
    return prompt;
  }

  async createPrompt(data: {
    name: string;
    category: string;
    content: string;
  }): Promise<GenerationPrompt> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      // Find max version
      const latest = await tx.generationPrompt.findFirst({
        where: { name: data.name },
        orderBy: { version: "desc" },
      });

      const nextVersion = latest ? latest.version + 1 : 1;

      // Deactivate all older versions of this prompt
      await tx.generationPrompt.updateMany({
        where: { name: data.name, isActive: true },
        data: { isActive: false },
      });

      return tx.generationPrompt.create({
        data: {
          name: data.name,
          category: data.category,
          content: data.content,
          version: nextVersion,
          isActive: true,
        },
      });
    });
  }

  async updatePrompt(
    id: string,
    data: { content?: string; isActive?: boolean },
  ): Promise<GenerationPrompt> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const existing = await tx.generationPrompt.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException(`Prompt with ID ${id} not found`);
      }

      if (data.content !== undefined && data.content !== existing.content) {
        // If content is changing, we create a new version of the prompt!
        const latest = await tx.generationPrompt.findFirst({
          where: { name: existing.name },
          orderBy: { version: "desc" },
        });
        const nextVersion = latest ? latest.version + 1 : 1;

        // Deactivate all versions of this prompt
        await tx.generationPrompt.updateMany({
          where: { name: existing.name, isActive: true },
          data: { isActive: false },
        });

        return tx.generationPrompt.create({
          data: {
            name: existing.name,
            category: existing.category,
            content: data.content,
            version: nextVersion,
            isActive: data.isActive !== undefined ? data.isActive : true,
          },
        });
      } else {
        // Just standard update (e.g. toggling isActive)
        return tx.generationPrompt.update({
          where: { id },
          data: {
            isActive:
              data.isActive !== undefined ? data.isActive : existing.isActive,
          },
        });
      }
    });
  }
}

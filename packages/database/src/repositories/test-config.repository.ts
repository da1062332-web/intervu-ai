import { prisma } from "../client";
import { RepositoryError } from "../types/database.types";
import type { Prisma, TestConfig, TestSection, TestRule } from "@prisma/client";

type TestConfigWithRelations = TestConfig & {
  sections: TestSection[];
  rule: TestRule | null;
};

export class TestConfigRepository {
  private validate(input: any) {
    if (!input)
      throw new RepositoryError(
        "INVALID_INPUT",
        "Input cannot be null or undefined.",
      );
  }

  async create(
    data: Prisma.TestConfigCreateInput,
  ): Promise<TestConfigWithRelations> {
    this.validate(data);
    try {
      const result = await prisma.testConfig.create({
        data,
        include: { sections: true, rule: true },
      });
      return result;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new RepositoryError(
          "DUPLICATE_CONFIG_KEY",
          "A TestConfig with this key already exists.",
        );
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findAll(): Promise<TestConfigWithRelations[]> {
    try {
      const results = await prisma.testConfig.findMany({
        include: { sections: true, rule: true },
      });
      return results;
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findById(id: string): Promise<TestConfigWithRelations | null> {
    this.validate(id);
    try {
      const result = await prisma.testConfig.findUnique({
        where: { id },
        include: { sections: true, rule: true },
      });
      return result;
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async findByConfigKey(
    configKey: string,
  ): Promise<TestConfigWithRelations | null> {
    this.validate(configKey);
    try {
      const result = await prisma.testConfig.findUnique({
        where: { configKey },
        include: { sections: true, rule: true },
      });
      return result;
    } catch (error: any) {
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async update(
    id: string,
    data: Prisma.TestConfigUpdateInput,
  ): Promise<TestConfigWithRelations> {
    this.validate(id);
    this.validate(data);
    try {
      const result = await prisma.testConfig.update({
        where: { id },
        data,
        include: { sections: true, rule: true },
      });
      return result;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new RepositoryError("NOT_FOUND", "TestConfig not found.");
      }
      throw new RepositoryError("DB_ERROR", error.message);
    }
  }

  async deactivate(id: string): Promise<TestConfigWithRelations> {
    return this.update(id, { isActive: false });
  }
}

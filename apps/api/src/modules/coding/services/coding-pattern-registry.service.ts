import { Injectable, NotFoundException } from "@nestjs/common";
import { CodingPatternRepository } from "../repositories/coding-pattern.repository";
import { OracleRegistry } from "../oracles/oracle.registry";
import { BaseOracle } from "../interfaces/oracle.interface";
import { CodingPattern, CodingPatternStatus } from "@prisma/client";

@Injectable()
export class CodingPatternRegistryService {
  constructor(
    private readonly patternRepo: CodingPatternRepository,
    private readonly oracleRegistry: OracleRegistry,
  ) {}

  async resolvePattern(patternIdOrKey: string): Promise<CodingPattern> {
    let pattern = await this.patternRepo.findById(patternIdOrKey);
    if (!pattern) {
      pattern = await this.patternRepo.findByPatternKey(patternIdOrKey);
    }
    if (!pattern) {
      pattern = await this.patternRepo.findBySlug(patternIdOrKey);
    }
    if (!pattern) {
      throw new NotFoundException(`Coding Pattern "${patternIdOrKey}" not found.`);
    }
    return pattern;
  }

  async resolvePublishedPattern(patternIdOrKey: string): Promise<CodingPattern> {
    const pattern = await this.resolvePattern(patternIdOrKey);
    if (pattern.status !== CodingPatternStatus.PUBLISHED) {
      throw new NotFoundException(`Coding Pattern "${patternIdOrKey}" is not published.`);
    }
    return pattern;
  }

  resolveOracle(oracleKey: string): BaseOracle {
    return this.oracleRegistry.getOracle(oracleKey);
  }
}

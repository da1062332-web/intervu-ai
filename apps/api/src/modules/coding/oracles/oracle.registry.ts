import { Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { BaseOracle, OracleMetadata } from "../interfaces/oracle.interface";
import { ORACLE_PROVIDERS_TOKEN } from "./oracle.constants";

@Injectable()
export class OracleRegistry {
  private readonly registry = new Map<string, BaseOracle>();

  constructor(
    @Optional() @Inject(ORACLE_PROVIDERS_TOKEN) injectedOracles?: BaseOracle[] | BaseOracle,
  ) {
    let oracleList: BaseOracle[] = [];
    if (Array.isArray(injectedOracles)) {
      oracleList = injectedOracles;
    } else if (injectedOracles) {
      oracleList = [injectedOracles];
    }

    for (const oracle of oracleList) {
      if (oracle && oracle.key) {
        this.registerOracle(oracle);
      }
    }
  }

  registerOracle(oracle: BaseOracle): void {
    if (!oracle || !oracle.key) {
      throw new Error("Cannot register an Oracle without a valid key property.");
    }
    this.registry.set(oracle.key, oracle);
  }

  getOracle(oracleKey: string): BaseOracle {
    const oracle = this.registry.get(oracleKey);
    if (!oracle) {
      throw new NotFoundException(`Oracle implementation for key "${oracleKey}" not found in OracleRegistry.`);
    }
    return oracle;
  }

  hasOracle(oracleKey: string): boolean {
    return this.registry.has(oracleKey);
  }

  getAllOracles(): BaseOracle[] {
    return Array.from(this.registry.values());
  }

  getAllMetadata(): OracleMetadata[] {
    return this.getAllOracles().map((oracle) => this.toMetadata(oracle));
  }

  getMetadataByKey(oracleKey: string): OracleMetadata {
    const oracle = this.getOracle(oracleKey);
    return this.toMetadata(oracle);
  }

  private toMetadata(oracle: BaseOracle): OracleMetadata {
    return {
      key: oracle.key,
      name: oracle.name,
      category: oracle.category || "GENERAL",
      description: oracle.description || "",
      supportedDifficulties: oracle.supportedDifficulties || ["EASY", "MEDIUM", "HARD"],
      parameterSchema: oracle.parameterSchema || {},
    };
  }
}
